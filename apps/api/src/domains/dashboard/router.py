from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from apps.api.src.core.database import get_db
from apps.api.src.domains.inventory.models import InventoryItem
from apps.api.src.domains.rentals.models import Rental
from apps.api.src.domains.auth.models import User

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("")
def get_dashboard_summary(db: Session = Depends(get_db)):
    # Calculate live aggregated stock metrics
    items = db.query(InventoryItem).all()
    total_stock = sum(item.total for item in items)
    available_stock = sum(item.available for item in items)
    rented_stock = sum(item.rented for item in items)

    # Active rentals / upcoming returns
    active_rentals = db.query(Rental).filter(Rental.status == "ACTIVE").order_by(Rental.id.desc()).all()
    
    if active_rentals:
        primary_return = {
            "id": str(active_rentals[0].id),
            "title": active_rentals[0].client_name,
            "details": f"{active_rentals[0].quantity} {active_rentals[0].item_name}",
            "dueTime": active_rentals[0].due_time,
            "status": f"{len(active_rentals)} Due Today" if len(active_rentals) == 1 else f"{len(active_rentals)} Due Soon"
        }
    else:
        primary_return = {
            "id": "0",
            "title": "All Returns Cleared",
            "details": "No pending equipment dispatches",
            "dueTime": "Warehouse balanced",
            "status": "All Caught Up"
        }

    # Format quick inventory list
    quick_inventory = [
        {
            "id": str(item.id),
            "name": item.name,
            "available": item.available,
            "total": item.total,
            "rented": item.rented,
            "icon": item.icon,
            "imageUrl": item.image_url,
            "percentage": round((item.available / item.total * 100), 1) if item.total > 0 else 0
        }
        for item in items[:5]
    ]

    # Current user
    user = db.query(User).first()
    user_data = {
        "firstName": user.first_name if user else "Sarah",
        "email": user.email if user else "name@rentory.supply",
        "terminalId": user.terminal_id if user else "Terminal 07"
    }

    # Current dynamic date
    today = datetime.now()
    formatted_date = today.strftime("%A, %d %b")

    return {
        "user": user_data,
        "date": formatted_date,
        "stats": {
            "total": total_stock,
            "available": available_stock,
            "rented": rented_stock
        },
        "upcomingReturn": primary_return,
        "upcomingReturns": [
            {
                "id": str(r.id),
                "client": r.client_name,
                "clientName": r.client_name,
                "equipId": str(r.item_id),
                "itemId": r.item_id,
                "equipName": r.item_name,
                "itemName": r.item_name,
                "units": r.quantity,
                "quantity": r.quantity,
                "dueTime": r.due_time,
                "dueText": r.due_time,
                "status": r.status.lower(),
                "isUrgent": r.is_urgent == 1
            }
            for r in active_rentals
        ],
        "inventory": quick_inventory
    }
