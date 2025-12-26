from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON, Date
from sqlalchemy.sql import func
from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100))
    role = Column(String(20), default="viewer")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

class DataSource(Base):
    __tablename__ = "data_sources"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String(255), nullable=False)
    file_type = Column(String(20), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer)
    row_count = Column(Integer)
    column_count = Column(Integer)
    columns_meta = Column(JSON)
    data_type = Column(String(20), default="dashboard")  # dashboard | isc
    status = Column(String(20), default="pending")
    error_message = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

class AppConfig(Base):
    """Store app-wide configurations like dashboard layout"""
    __tablename__ = "app_configs"
    id = Column(Integer, primary_key=True)
    key = Column(String(100), unique=True, nullable=False)
    value = Column(JSON, nullable=False)
    updated_by = Column(Integer, ForeignKey("users.id"))
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class DashboardData(Base):
    __tablename__ = "dashboard_data"
    id = Column(Integer, primary_key=True)
    source_id = Column(Integer, ForeignKey("data_sources.id"), index=True)
    reporting_day = Column(Date, index=True)
    customer = Column(String(255), index=True)
    category = Column(String(255), index=True)
    product = Column(String(255), index=True)
    status = Column(String(50), index=True)
    current_status = Column(String(50))
    production_no = Column(Integer)  # Use 0 if missing
    root_cause = Column(String(500))
    improvement_plan = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
