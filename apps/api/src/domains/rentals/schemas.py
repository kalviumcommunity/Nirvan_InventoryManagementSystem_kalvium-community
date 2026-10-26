from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class RentalCreate(BaseModel):
    client_name: str
    item_id: int
    quantity: int = 1
    due_time: Optional[str] = "Due 6:00 PM today"
    due_date: Optional[str] = None
    phone: Optional[str] = None
    contact: Optional[str] = None
    is_urgent: Optional[int] = 0
    notes: Optional[str] = None

class RentalUpdate(BaseModel):
    client_name: Optional[str] = None
    quantity: Optional[int] = None
    due_time: Optional[str] = None
    due_date: Optional[str] = None
    phone: Optional[str] = None
    contact: Optional[str] = None
    status: Optional[str] = None
    is_urgent: Optional[int] = None
    notes: Optional[str] = None

class RentalResponse(BaseModel):
    id: int
    client_name: str
    item_id: int
    item_name: str
    quantity: int
    due_time: str
    due_date: Optional[str] = None
    phone: Optional[str] = None
    contact: Optional[str] = None
    is_urgent: Optional[int] = 0
    status: str
    notes: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
