from pydantic_settings import BaseSettings
import secrets

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str  # REQUIRED: Must be set in .env
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 100 * 1024 * 1024  # 100MB
    REDIS_URL: str = "redis://localhost:6379"
    ENVIRONMENT: str = "development"  # development, staging, production
    
    class Config:
        env_file = ".env"
    
    @classmethod
    def generate_secret_key(cls) -> str:
        """Generate a secure random secret key"""
        return secrets.token_urlsafe(32)

settings = Settings()
