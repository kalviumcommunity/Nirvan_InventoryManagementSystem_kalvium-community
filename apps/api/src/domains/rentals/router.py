from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from apps.api.src.core.database import get_db
from apps.api.src.domains.rentals.models import Rental
from apps.api.src.domains.rentals.schemas import RentalCreate, RentalUpdate, RentalResponse
from apps.api.src.domains.inventory.models import InventoryItem

router = APIRouter(prefix="/rentals", tags=["Rentals"])

@router.get("", response_model=List[RentalResponse])
def get_rentals(
    status: Optional[str] = Query(None, description="Filter by status (e.g. ACTIVE, RETURNED, or All)"),
    item_id: Optional[int] = Query(None, description="Filter by inventory item ID"),
    db: Session = Depends(get_db)
):
    query = db.query(Rental)
    if status and status.lower() != "all":
        query = query.filter(Rental.status == status.upper())
    if item_id:
        query = query.filter(Rental.item_id == item_id)
    return query.order_by(Rental.id.desc()).all()

@router.get("/{rental_id}", response_model=RentalResponse)
def get_rental(rental_id: int, db: Session = Depends(get_db)):
    rental = db.query(Rental).filter(Rental.id == rental_id).first()
    if not rental:
        raise HTTPException(status_code=404, detail="Rental record not found")
    return rental

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
        phone=payload.phone,
        contact=payload.contact,
        is_urgent=payload.is_urgent or 0,
        status="ACTIVE",
        notes=payload.notes
    )
    db.add(rental)
    db.commit()
    db.refresh(rental)
    db.refresh(item)
    return rental

@router.put("/{rental_id}", response_model=RentalResponse)
def update_rental(rental_id: int, payload: RentalUpdate, db: Session = Depends(get_db)):
    rental = db.query(Rental).filter(Rental.id == rental_id).first()
    if not rental:
        raise HTTPException(status_code=404, detail="Rental record not found")

    item = db.query(InventoryItem).filter(InventoryItem.id == rental.item_id).first()

    # Handle quantity delta adjustment if rental is ACTIVE
    if payload.quantity is not None and payload.quantity != rental.quantity:
        delta = payload.quantity - rental.quantity
        if rental.status == "ACTIVE" and item:
            if delta > 0 and item.available < delta:
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot increase by {delta}. Only {item.available} units available."
                )
            item.available -= delta
            item.rented += delta
        rental.quantity = payload.quantity

    if payload.client_name is not None:
        rental.client_name = payload.client_name
    if payload.due_time is not None:
        rental.due_time = payload.due_time
    if payload.due_date is not None:
        rental.due_date = payload.due_date
    if payload.phone is not None:
        rental.phone = payload.phone
    if payload.contact is not None:
        rental.contact = payload.contact
    if payload.is_urgent is not None:
        rental.is_urgent = payload.is_urgent
    if payload.notes is not None:
        rental.notes = payload.notes
    if payload.status is not None:
        rental.status = payload.status.upper()

    db.commit()
    db.refresh(rental)
    if item:
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

@router.post("/{rental_id}/reactivate", response_model=RentalResponse)
def reactivate_rental(rental_id: int, db: Session = Depends(get_db)):
    rental = db.query(Rental).filter(Rental.id == rental_id).first()
    if not rental:
        raise HTTPException(status_code=404, detail="Rental record not found")

    if rental.status == "ACTIVE":
        return rental

    item = db.query(InventoryItem).filter(InventoryItem.id == rental.item_id).first()
    if item:
        if item.available < rental.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Not enough units in stock to reopen. {item.available} available."
            )
        item.available -= rental.quantity
        item.rented += rental.quantity

    rental.status = "ACTIVE"
    db.commit()
    db.refresh(rental)
    if item:
        db.refresh(item)
    return rental

@router.delete("/{rental_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_rental(rental_id: int, db: Session = Depends(get_db)):
    rental = db.query(Rental).filter(Rental.id == rental_id).first()
    if not rental:
        raise HTTPException(status_code=404, detail="Rental record not found")

    # If active, restore inventory stock before deletion
    if rental.status == "ACTIVE":
        item = db.query(InventoryItem).filter(InventoryItem.id == rental.item_id).first()
        if item:
            item.available = min(item.total, item.available + rental.quantity)
            item.rented = max(0, item.rented - rental.quantity)

    db.delete(rental)
    db.commit()
    return None
