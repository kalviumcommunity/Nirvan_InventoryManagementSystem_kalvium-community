from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "Rentory API"
    API_V1_PREFIX: str = "/api"
    DATABASE_URL: str = "sqlite:///./rentory.db"
    CORS_ORIGINS: List[str] = ["*"]
    
    class Config:
        case_sensitive = True

settings = Settings()
