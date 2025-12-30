"""
DataSource response schemas - Pydantic models for DataSource API responses
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime


# ============ Column Schema Models ============

class ColumnMetaResponse(BaseModel):
    """Column metadata"""
    name: str
    original_dtype: str
    detected_type: str
    nullable: bool
    unique_count: int
    null_count: int
    sample_values: List[Any]


# ============ DataSource Models ============

class DataSourceResponse(BaseModel):
    """Single data source response"""
    id: int
    name: str
    file_type: str
    row_count: Optional[int] = None
    column_count: Optional[int] = None
    columns_meta: Optional[List[ColumnMetaResponse]] = Field(None, alias="columns")
    data_type: str = "dashboard"
    status: str
    created_at: Optional[datetime] = None

    class Config:
        populate_by_name = True


class DataSourceListItemResponse(BaseModel):
    """Data source item in list"""
    id: int
    name: str
    file_type: str
    columns: Optional[Any] = None
    row_count: Optional[int] = None
    column_count: Optional[int] = None
    data_type: str = "dashboard"
    status: str
    created_at: Optional[str] = None


class DataSourceListResponse(BaseModel):
    """Paginated list of data sources"""
    items: List[DataSourceListItemResponse]
    total: int
    page: int
    page_size: int


# ============ Preview Models ============

class PreviewResponse(BaseModel):
    """Data source preview response"""
    columns: Optional[Any] = None
    data: List[dict]
    total_rows: int
    preview_rows: int


# ============ Data Models ============

class DataResponse(BaseModel):
    """Paginated data response"""
    columns: Optional[Any] = None
    data: List[dict]
    total: int
    page: int
    page_size: int
    total_pages: int


# ============ Validation Models ============

class ValidationResponse(BaseModel):
    """Data validation response"""
    valid: bool
    row_count: int
    column_count: int
    duplicate_rows: int
    errors: List[str]
    warnings: List[str]


# ============ Schema Detection Models ============

class SchemaResponse(BaseModel):
    """Schema detection response"""
    schema: List[ColumnMetaResponse]


# ============ Process Models ============

class ProcessResponse(BaseModel):
    """Process source response"""
    id: int
    name: str
    columns: Optional[Any] = None
    row_count: Optional[int] = None
    status: str
    created_at: Optional[str] = None


# ============ Delete Models ============

class DeleteResponse(BaseModel):
    """Delete confirmation response"""
    ok: bool = True
