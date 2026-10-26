from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class RentalCreate(BaseModel):
    client_name: str
    item_id: int
    quantity: int = 1
    due_time: Optional[str] = "Due 6:00 PM today"
    due_date: Optional[str] = None
    notes: Optional[str] = None

class RentalResponse(BaseModel):
    id: int
    client_name: str
    item_id: int
    item_name: str
    quantity: int
    due_time: str
    due_date: Optional[str] = None
    status: str
    notes: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
