from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from apps.api.src.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    first_name = Column(String, default="Sarah")
    terminal_id = Column(String, default="Terminal 07")
    password_hash = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
