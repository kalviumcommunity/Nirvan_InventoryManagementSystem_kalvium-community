from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from apps.api.src.core.database import get_db
from apps.api.src.domains.auth.models import User
from apps.api.src.domains.auth.schemas import LoginRequest, SignUpRequest, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=UserResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        # For warehouse terminal convenience, auto-create operator if not exists
        first_name = payload.email.split("@")[0].capitalize()
        user = User(
            email=payload.email,
            first_name=first_name,
            terminal_id=payload.terminal_id or "Terminal 07"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

@router.post("/signup", response_model=UserResponse)
def signup(payload: SignUpRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        return existing
    user = User(
        email=payload.email,
        first_name=payload.first_name or payload.email.split("@")[0].capitalize(),
        terminal_id=payload.terminal_id or "Terminal 07"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.get("/me", response_model=UserResponse)
def get_current_user(db: Session = Depends(get_db)):
    user = db.query(User).first()
    if not user:
        user = User(email="name@rentory.supply", first_name="Sarah", terminal_id="Terminal 07")
        db.add(user)
        db.commit()
        db.refresh(user)
    return user
