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
                    short_name="Speakers",
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
                    short_name="Microphones",
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
                    short_name="Stage Lights",
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
                    short_name="Fog & FX Machines",
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

            # Seed initial active & history rentals
            speaker_item = db.query(InventoryItem).filter(InventoryItem.name.ilike('%speaker%')).first()
            mic_item = db.query(InventoryItem).filter(InventoryItem.name.ilike('%microphone%')).first()
            light_item = db.query(InventoryItem).filter(InventoryItem.name.ilike('%light%')).first()

            rentals = []
            if speaker_item:
                rentals.extend([
                    Rental(
                        client_name="Sharma Wedding",
                        item_id=speaker_item.id,
                        item_name=speaker_item.name,
                        quantity=4,
                        due_time="Due today 6 PM",
                        due_date="21 Sep 2025, 06:00 PM",
                        phone="+91 98201 55432",
                        contact="Rahul Sharma (+91 98402 11920)",
                        is_urgent=1,
                        status="ACTIVE",
                        notes="Reception main stage audio setup"
                    ),
                    Rental(
                        client_name="ABC Events",
                        item_id=speaker_item.id,
                        item_name=speaker_item.name,
                        quantity=3,
                        due_time="Due 22 Sep",
                        due_date="22 Sep 2025, 05:00 PM",
                        phone="+91 98111 22334",
                        contact="Anita Gupta (+91 98111 22334)",
                        is_urgent=0,
                        status="ACTIVE",
                        notes="Conference breakout audio"
                    ),
                    Rental(
                        client_name="Royal Events",
                        item_id=speaker_item.id,
                        item_name=speaker_item.name,
                        quantity=3,
                        due_time="Due 23 Sep",
                        due_date="23 Sep 2025, 08:00 PM",
                        phone="+91 98765 43210",
                        contact="Vikram Malhotra (+91 98765 43210)",
                        is_urgent=0,
                        status="ACTIVE",
                        notes="VIP banquet hall setup"
                    )
                ])

            if light_item:
                rentals.append(
                    Rental(
                        client_name="Nexus Tech Summit",
                        item_id=light_item.id,
                        item_name=light_item.name,
                        quantity=6,
                        due_time="Due 24 Sep",
                        due_date="24 Sep 2025, 10:00 PM",
                        phone="+91 98333 44556",
                        contact="Pooja Iyer (+91 98333 44556)",
                        is_urgent=0,
                        status="ACTIVE",
                        notes="Keynote stage lighting"
                    )
                )

            if mic_item:
                rentals.append(
                    Rental(
                        client_name="City Hall Gala",
                        item_id=mic_item.id,
                        item_name=mic_item.name,
                        quantity=3,
                        due_time="Completed",
                        due_date="20 Sep 2025, 02:00 PM",
                        phone="+91 98444 55667",
                        contact="Karan Mehra (+91 98444 55667)",
                        is_urgent=0,
                        status="RETURNED",
                        notes="Podium speech wireless microphones"
                    )
                )

            db.add_all(rentals)
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
