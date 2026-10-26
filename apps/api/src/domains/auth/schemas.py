from pydantic import BaseModel
from typing import Optional

class LoginRequest(BaseModel):
    email: str
    password: Optional[str] = None
    terminal_id: Optional[str] = "Terminal 07"

class SignUpRequest(BaseModel):
    email: str
    first_name: Optional[str] = "Operator"
    password: Optional[str] = None
    terminal_id: Optional[str] = "Terminal 07"

class UserResponse(BaseModel):
    id: int
    email: str
    first_name: str
    terminal_id: str

    class Config:
        from_attributes = True
