from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "Rentory API"
    API_V1_PREFIX: str = "/api"
    DATABASE_URL: str = "sqlite:///./rentory.db"
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8081"]
    
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
