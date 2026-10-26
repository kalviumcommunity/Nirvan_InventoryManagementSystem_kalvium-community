from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from apps.api.src.core.database import get_db
from apps.api.src.domains.inventory.models import InventoryItem
from apps.api.src.domains.inventory.schemas import (
    InventoryItemCreate,
    InventoryItemUpdate,
    InventoryItemResponse
)

router = APIRouter(prefix="/inventory", tags=["Inventory"])

@router.get("", response_model=List[InventoryItemResponse])
def get_inventory(
    category: Optional[str] = Query(None, description="Category filter (e.g. Audio, Lighting, FX, All)"),
    search: Optional[str] = Query(None, description="Search term for equipment name"),
    db: Session = Depends(get_db)
):
    query = db.query(InventoryItem)

    if category and category.lower() != "all":
        query = query.filter(InventoryItem.category.ilike(f"%{category}%"))

    if search:
        query = query.filter(InventoryItem.name.ilike(f"%{search.strip()}%"))

    return query.order_by(InventoryItem.id.asc()).all()

@router.post("", response_model=InventoryItemResponse, status_code=status.HTTP_201_CREATED)
def create_inventory_item(payload: InventoryItemCreate, db: Session = Depends(get_db)):
    # Match default icon / image according to category if not provided
    image_url = payload.image_url or "speaker.png"
    icon = payload.icon or "ph-speaker-hifi"
    cat_lower = payload.category.lower()
    if "light" in cat_lower:
        image_url = "lights.png"
        icon = "ph-lightbulb"
    elif "micro" in cat_lower or "mic" in payload.name.lower():
        image_url = "microphone.png"
        icon = "ph-microphone"
    elif "fog" in cat_lower or "fx" in cat_lower or "fog" in payload.name.lower():
        image_url = "fog.png"
        icon = "ph-cloud-fog"

    item = InventoryItem(
        name=payload.name,
        category=payload.category,
        total=payload.total,
        available=payload.total,
        rented=0,
        image_url=image_url,
        icon=icon,
        model=payload.model,
        rate_per_day=payload.rate_per_day or 0.0
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.get("/{item_id}", response_model=InventoryItemResponse)
def get_inventory_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Equipment item not found")
    return item

@router.put("/{item_id}", response_model=InventoryItemResponse)
def update_inventory_item(item_id: int, payload: InventoryItemUpdate, db: Session = Depends(get_db)):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Equipment item not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(item, field, val)

    # Recalculate available if total changed
    if "total" in update_data and "available" not in update_data:
        item.available = max(0, item.total - item.rented)

    db.commit()
    db.refresh(item)
    return item

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_inventory_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Equipment item not found")
    db.delete(item)
    db.commit()
    return None
