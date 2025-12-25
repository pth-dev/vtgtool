from pydantic import BaseModel, EmailStr, field_validator, Field
from typing import Optional, Any
from datetime import datetime
import re

# Auth
class LoginRequest(BaseModel):
    email: EmailStr  # Auto-validates email format
    password: str = Field(..., min_length=1)

class RegisterRequest(BaseModel):
    email: EmailStr  # Auto-validates email format
    password: str = Field(..., min_length=8, max_length=100)
    full_name: Optional[str] = Field(None, max_length=200)
    role: str = Field("viewer", pattern="^(admin|editor|viewer)$")

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v

    @field_validator('full_name')
    @classmethod
    def sanitize_full_name(cls, v: Optional[str]) -> Optional[str]:
        """Sanitize full name - remove HTML tags and extra whitespace"""
        if not v:
            return v
        # Remove HTML tags
        v = re.sub(r'<[^>]+>', '', v)
        # Remove extra whitespace
        v = ' '.join(v.split())
        return v.strip()

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    role: str

# DataSource
class DataSourceResponse(BaseModel):
    id: int
    name: str
    file_type: str
    row_count: Optional[int]
    column_count: Optional[int]
    columns_meta: Optional[Any]
    data_type: str = "dashboard"
    status: str
    created_at: datetime
