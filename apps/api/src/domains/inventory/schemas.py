from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class InventoryItemBase(BaseModel):
    name: str
    short_name: Optional[str] = None
    category: str = "Audio"
    total: int = 10
    image_url: Optional[str] = "speaker.png"
    icon: Optional[str] = "ph-speaker-hifi"
    model: Optional[str] = None
    rate_per_day: Optional[float] = 0.0

class InventoryItemCreate(InventoryItemBase):
    pass

class InventoryItemUpdate(BaseModel):
    name: Optional[str] = None
    short_name: Optional[str] = None
    category: Optional[str] = None
    total: Optional[int] = None
    available: Optional[int] = None
    rented: Optional[int] = None
    image_url: Optional[str] = None
    icon: Optional[str] = None
    rate_per_day: Optional[float] = None

class InventoryItemResponse(InventoryItemBase):
    id: int
    available: int
    rented: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
