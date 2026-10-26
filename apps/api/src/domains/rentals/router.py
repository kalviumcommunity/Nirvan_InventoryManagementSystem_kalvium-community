from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from apps.api.src.core.database import get_db
from apps.api.src.domains.rentals.models import Rental
from apps.api.src.domains.rentals.schemas import RentalCreate, RentalResponse
from apps.api.src.domains.inventory.models import InventoryItem

router = APIRouter(prefix="/rentals", tags=["Rentals"])

@router.get("", response_model=List[RentalResponse])
def get_rentals(
    status: Optional[str] = Query(None, description="Filter by status (e.g. ACTIVE, RETURNED, or All)"),
    db: Session = Depends(get_db)
):
    query = db.query(Rental)
    if status and status.lower() != "all":
        query = query.filter(Rental.status == status.upper())
    return query.order_by(Rental.id.desc()).all()

@router.post("", response_model=RentalResponse, status_code=status.HTTP_201_CREATED)
def create_rental(payload: RentalCreate, db: Session = Depends(get_db)):
    item = db.query(InventoryItem).filter(InventoryItem.id == payload.item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    if payload.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than 0")

    if item.available < payload.quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient stock. Only {item.available} units available of {item.name}"
        )

    # Decrement available, increment rented
    item.available -= payload.quantity
    item.rented += payload.quantity

    rental = Rental(
        client_name=payload.client_name,
        item_id=item.id,
        item_name=item.name,
        quantity=payload.quantity,
        due_time=payload.due_time or "Due 6:00 PM today",
        due_date=payload.due_date,
        status="ACTIVE",
        notes=payload.notes
    )
    db.add(rental)
    db.commit()
    db.refresh(rental)
    db.refresh(item)
    return rental

@router.post("/{rental_id}/return", response_model=RentalResponse)
def return_rental(rental_id: int, db: Session = Depends(get_db)):
    rental = db.query(Rental).filter(Rental.id == rental_id).first()
    if not rental:
        raise HTTPException(status_code=404, detail="Rental record not found")

    if rental.status == "RETURNED":
        return rental

    # Return gear to inventory
    item = db.query(InventoryItem).filter(InventoryItem.id == rental.item_id).first()
    if item:
        item.available = min(item.total, item.available + rental.quantity)
        item.rented = max(0, item.rented - rental.quantity)

    rental.status = "RETURNED"
    db.commit()
    db.refresh(rental)
    if item:
        db.refresh(item)
    return rental
