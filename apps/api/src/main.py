import sys
from pathlib import Path

# Ensure monorepo root directory is in sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apps.api.src.core.config import settings
from apps.api.src.core.database import Base, engine, SessionLocal
from apps.api.src.domains.auth.models import User
from apps.api.src.domains.inventory.models import InventoryItem
from apps.api.src.domains.rentals.models import Rental

# Routers
from apps.api.src.domains.auth.router import router as auth_router
from apps.api.src.domains.inventory.router import router as inventory_router
from apps.api.src.domains.rentals.router import router as rentals_router
from apps.api.src.domains.dashboard.router import router as dashboard_router

def seed_database():
    """Initializes tables and seeds base equipment data if database is clean."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Seed default user if empty
        if not db.query(User).first():
            default_user = User(
                email="name@rentory.supply",
                first_name="Sarah",
                terminal_id="Terminal 07"
            )
            db.add(default_user)

        # Seed inventory if empty
        if not db.query(InventoryItem).first():
            items = [
                InventoryItem(
                    name='JBL EON 15" Speakers',
                    category="Audio",
                    total=20,
                    available=10,
                    rented=10,
                    image_url="speaker.png",
                    icon="ph-speaker-hifi",
                    model="EON615",
                    rate_per_day=45.0
                ),
                InventoryItem(
                    name="Wireless Microphones (Shure)",
                    category="Audio",
                    total=15,
                    available=12,
                    rented=3,
                    image_url="microphone.png",
                    icon="ph-microphone",
                    model="BLX24/PG58",
                    rate_per_day=25.0
                ),
                InventoryItem(
                    name="Stage Lights (RGBW DMX)",
                    category="Lighting",
                    total=30,
                    available=20,
                    rented=10,
                    image_url="lights.png",
                    icon="ph-lightbulb",
                    model="PAR-64 LED",
                    rate_per_day=35.0
                ),
                InventoryItem(
                    name="Fog & FX Machines",
                    category="FX",
                    total=8,
                    available=5,
                    rented=3,
                    image_url="fog.png",
                    icon="ph-cloud-fog",
                    model="Hurricane 1800",
                    rate_per_day=60.0
                ),
            ]
            db.add_all(items)
            db.commit()

            # Seed initial active rental
            speaker_item = db.query(InventoryItem).filter(InventoryItem.name.ilike('%speaker%')).first()
            if speaker_item:
                rental = Rental(
                    client_name="Sharma Wedding",
                    item_id=speaker_item.id,
                    item_name=speaker_item.name,
                    quantity=4,
                    due_time="Due 6:00 PM today",
                    status="ACTIVE",
                    notes="Reception main stage audio setup"
                )
                db.add(rental)
                db.commit()
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    seed_database()
    yield

# Also seed on startup
try:
    seed_database()
except Exception as e:
    print(f"Initial DB seed warning: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan,
    version="1.0.0"
)

# Configure CORS for Web dashboard, Mobile Expo, and local networks
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Domain Routers
app.include_router(dashboard_router, prefix=settings.API_V1_PREFIX)
app.include_router(inventory_router, prefix=settings.API_V1_PREFIX)
app.include_router(rentals_router, prefix=settings.API_V1_PREFIX)
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Rentory Inventory & Rental Dispatch Management System",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    uvicorn.run("apps.api.src.main:app", host="0.0.0.0", port=8000, reload=True)
