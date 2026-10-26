from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from apps.api.src.core.database import Base

class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    category = Column(String, index=True, default="Audio")
    total = Column(Integer, default=0, nullable=False)
    available = Column(Integer, default=0, nullable=False)
    rented = Column(Integer, default=0, nullable=False)
    image_url = Column(String, default="speaker.png")
    icon = Column(String, default="ph-speaker-hifi")
    model = Column(String, nullable=True)
    rate_per_day = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
