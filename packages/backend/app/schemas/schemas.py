from pydantic import BaseModel, field_validator, Field
from typing import Optional, Any
from datetime import datetime
import re

# Email validation pattern to allow local domains like .local
EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def validate_email(value: str) -> str:
    if not EMAIL_PATTERN.match(value):
        raise ValueError("Must be a valid email address")
    return value

# Auth
class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=320)
    password: str = Field(..., min_length=1)

    @field_validator('email')
    @classmethod
    def validate_email_field(cls, value: str) -> str:
        return validate_email(value)

class RegisterRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=320)
    password: str = Field(..., min_length=8, max_length=100)
    full_name: Optional[str] = Field(None, max_length=200)
    role: str = Field("viewer", pattern="^(admin|editor|viewer)$")

    @field_validator('email')
    @classmethod
    def validate_email_field(cls, value: str) -> str:
        return validate_email(value)

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


# Common Responses
class MessageResponse(BaseModel):
    """Simple message response"""
    message: str


class ErrorResponse(BaseModel):
    """Standard error response"""
    error: str = Field(description="Error code")
    message: str = Field(description="Human-readable error message")
    detail: Optional[str] = Field(None, description="Additional error details")


class SuccessResponse(BaseModel):
    """Simple success response"""
    ok: bool = True
    message: Optional[str] = None

