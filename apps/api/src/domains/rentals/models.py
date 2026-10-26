from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime
from apps.api.src.core.database import Base

class Rental(Base):
    __tablename__ = "rentals"

    id = Column(Integer, primary_key=True, index=True)
    client_name = Column(String, index=True, nullable=False)
    item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    item_name = Column(String, nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    due_time = Column(String, default="Due 6:00 PM today")
    due_date = Column(String, nullable=True)
    status = Column(String, default="ACTIVE", index=True) # "ACTIVE", "RETURNED"
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
