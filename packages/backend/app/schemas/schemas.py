from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime

# Auth
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None
    role: str = "viewer"

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
