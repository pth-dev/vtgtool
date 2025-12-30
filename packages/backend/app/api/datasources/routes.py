"""
Datasources API routes
"""
import os
import uuid
import magic
import pandas as pd
import logging

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func, or_
from sqlalchemy import asc as sql_asc, desc as sql_desc

from app.core.database import get_db
from app.core.config import settings
from app.core.cache import cache_delete
from app.models.models import User, DataSource, DashboardData
from app.api.auth import get_current_user
from app.schemas.schemas import DataSourceResponse, SuccessResponse
from app.schemas.datasources import (
    DataSourceListResponse,
    PreviewResponse,
    DataResponse,
    ValidationResponse,
    SchemaResponse,
    ProcessResponse,
    DeleteResponse,
)
from app.services.data_processor import FileParser, SchemaDetector, DataValidator

from .upload import process_upload_task

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/upload", response_model=DataSourceResponse)
async def upload(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    data_type: str = Query("dashboard", regex="^(dashboard|isc)$"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Upload a new data source file"""
    # Check file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ['.csv', '.xlsx', '.xls', '.json']:
        raise HTTPException(400, "Unsupported file extension")

    # Read file content
    content = await file.read()

    # SECURITY: Validate MIME type
    mime = magic.from_buffer(content, mime=True)

    allowed_mimes = {
        '.csv': ['text/csv', 'text/plain', 'application/csv'],
        '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        '.xls': ['application/vnd.ms-excel'],
        '.json': ['application/json', 'text/plain'],
    }

    if mime not in allowed_mimes.get(ext, []):
        logger.warning(f"MIME type mismatch: file={file.filename}, ext={ext}, mime={mime}")
        raise HTTPException(400, f"Invalid file type. Expected {ext} but got {mime}")

    # Save uploaded file temporarily
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    with open(filepath, "wb") as f:
        f.write(content)
    
    # Create DataSource immediately
    source = DataSource(
        user_id=user.id, name=file.filename, file_type=ext[1:], file_path=filepath,
        file_size=len(content), data_type=data_type, status="pending"
    )
    db.add(source)
    await db.commit()
    await db.refresh(source)
    
    # Offload processing
    background_tasks.add_task(process_upload_task, source.id, filepath, data_type)
    
    return source


@router.get("", response_model=DataSourceListResponse)
async def list_sources(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str = Query(None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """List data sources for current user"""
    query = select(DataSource).where(DataSource.user_id == user.id)
    if search:
        query = query.where(DataSource.name.ilike(f"%{search}%"))
    
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query) or 0
    
    query = query.order_by(DataSource.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    sources = result.scalars().all()
    
    items = [{
        "id": s.id, "name": s.name, "file_type": s.file_type, "columns": s.columns_meta,
        "row_count": s.row_count, "column_count": s.column_count, "data_type": s.data_type,
        "status": s.status, "created_at": s.created_at.isoformat() if s.created_at else None
    } for s in sources]
    
    return {"items": items, "total": total, "page": page, "page_size": page_size}


# ============ SINGLE DATA SOURCE ROUTES ============

@router.get("/{id}", response_model=DataSourceResponse)
async def get_source(id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """Get a single data source"""
    result = await db.execute(select(DataSource).where(DataSource.id == id, DataSource.user_id == user.id))
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(404, "Not found")
    return {
        "id": source.id, "name": source.name, "file_type": source.file_type, "columns": source.columns_meta,
        "row_count": source.row_count, "column_count": source.column_count, "data_type": source.data_type,
        "status": source.status, "created_at": source.created_at.isoformat() if source.created_at else None
    }


@router.get("/{id}/preview", response_model=PreviewResponse)
async def preview(id: int, rows: int = Query(100, ge=1, le=500), db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """Preview data source contents"""
    result = await db.execute(select(DataSource).where(DataSource.id == id, DataSource.user_id == user.id))
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(404, "Not found")
    if not os.path.exists(source.file_path):
        raise HTTPException(404, "File not found on server")
    
    # For dashboard data, read from DB instead of raw file
    if source.data_type == "dashboard":
        db_count_result = await db.execute(
            select(func.count()).select_from(DashboardData).where(DashboardData.source_id == id)
        )
        db_row_count = db_count_result.scalar() or 0
        
        db_result = await db.execute(
            select(DashboardData)
            .where(DashboardData.source_id == id)
            .order_by(DashboardData.reporting_day.desc())
            .limit(rows)
        )
        db_rows = db_result.scalars().all()
        
        preview_data = []
        for row in db_rows:
            preview_data.append({
                "Reporting day": row.reporting_day.isoformat() if row.reporting_day else None,
                "Customer": row.customer or "",
                "Product": row.product or "",
                "Production Order No.": row.production_order_no or "",
                "Status": row.status or "",
                "Remark": row.root_cause or "",
                "Category": row.category or "",
                "Current status": row.current_status or "",
                "Production No": row.production_no or 0,
                "Root cause": row.root_cause or "",
                "Improvement plan": row.improvement_plan or ""
            })
        
        return {
            "columns": source.columns_meta, 
            "data": preview_data, 
            "total_rows": db_row_count,
            "preview_rows": min(rows, db_row_count)
        }
    
    # For non-dashboard data, read from file
    df = FileParser.parse(source.file_path)
    preview_df = df.head(rows).fillna("")
    return {"columns": source.columns_meta, "data": preview_df.to_dict(orient="records"), "total_rows": source.row_count, "preview_rows": min(rows, source.row_count or 0)}


@router.get("/{id}/data", response_model=DataResponse)
async def get_data(
    id: int, page: int = Query(1, ge=1), page_size: int = Query(50, ge=1, le=500),
    sort_by: str = Query(None), sort_order: str = Query("asc"), search: str = Query(None),
    db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)
):
    """Get paginated data from source"""
    result = await db.execute(select(DataSource).where(DataSource.id == id, DataSource.user_id == user.id))
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(404, "Not found")
    
    if source.data_type == "dashboard":
        query = select(DashboardData).where(DashboardData.source_id == id)
        
        if search:
            search_filter = or_(
                DashboardData.customer.ilike(f"%{search}%"),
                DashboardData.product.ilike(f"%{search}%"),
                DashboardData.production_order_no.ilike(f"%{search}%"),
                DashboardData.status.ilike(f"%{search}%"),
                DashboardData.category.ilike(f"%{search}%"),
                DashboardData.root_cause.ilike(f"%{search}%")
            )
            query = query.where(search_filter)
        
        count_query = select(func.count()).select_from(query.subquery())
        total = await db.scalar(count_query) or 0
        
        sort_column_map = {
            "Reporting day": DashboardData.reporting_day,
            "Customer": DashboardData.customer,
            "Product": DashboardData.product,
            "Production Order No.": DashboardData.production_order_no,
            "Status": DashboardData.status,
            "Category": DashboardData.category,
            "Production No": DashboardData.production_no,
        }
        if sort_by and sort_by in sort_column_map:
            col = sort_column_map[sort_by]
            query = query.order_by(sql_asc(col) if sort_order == "asc" else sql_desc(col))
        else:
            query = query.order_by(sql_desc(DashboardData.reporting_day))
        
        start = (page - 1) * page_size
        query = query.offset(start).limit(page_size)
        
        db_result = await db.execute(query)
        db_rows = db_result.scalars().all()
        
        data = []
        for row in db_rows:
            data.append({
                "Reporting day": row.reporting_day.isoformat() if row.reporting_day else None,
                "Customer": row.customer or "",
                "Product": row.product or "",
                "Production Order No.": row.production_order_no or "",
                "Status": row.status or "",
                "Category": row.category or "",
                "Current status": row.current_status or "",
                "Production No": row.production_no or 0,
                "Root cause": row.root_cause or "",
                "Improvement plan": row.improvement_plan or ""
            })
        
        return {
            "columns": source.columns_meta, 
            "data": data, 
            "total": total, 
            "page": page, 
            "page_size": page_size, 
            "total_pages": (total + page_size - 1) // page_size
        }
    
    # For non-dashboard data, read from file
    if not os.path.exists(source.file_path):
        raise HTTPException(404, "File not found")
    
    df = FileParser.parse(source.file_path)
    if search:
        mask = df.astype(str).apply(lambda x: x.str.contains(search, case=False, na=False)).any(axis=1)
        df = df[mask]
    
    total = len(df)
    if sort_by and sort_by in df.columns:
        df = df.sort_values(by=sort_by, ascending=(sort_order == "asc"))
    
    start = (page - 1) * page_size
    page_df = df.iloc[start:start + page_size].fillna("")
    
    return {"columns": source.columns_meta, "data": page_df.to_dict(orient="records"), "total": total, "page": page, "page_size": page_size, "total_pages": (total + page_size - 1) // page_size}


@router.get("/{id}/validate", response_model=ValidationResponse)
async def validate_source(id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """Validate data source"""
    result = await db.execute(select(DataSource).where(DataSource.id == id, DataSource.user_id == user.id))
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(404, "Not found")
    if not os.path.exists(source.file_path):
        raise HTTPException(404, "File not found")
    df = FileParser.parse(source.file_path)
    return DataValidator.validate(df)


@router.get("/{id}/schema", response_model=SchemaResponse)
async def detect_schema(id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """Detect schema for data source"""
    result = await db.execute(select(DataSource).where(DataSource.id == id, DataSource.user_id == user.id))
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(404, "Not found")
    if not os.path.exists(source.file_path):
        raise HTTPException(404, "File not found")
    df = FileParser.parse(source.file_path)
    return {"schema": SchemaDetector.detect_schema(df)}


@router.post("/{id}/process", response_model=ProcessResponse)
async def process_source(id: int, name: str = Query(None), db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """Mark source as processed"""
    result = await db.execute(select(DataSource).where(DataSource.id == id, DataSource.user_id == user.id))
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(404, "Not found")
    if name:
        source.name = name
    source.status = "ready"
    await db.commit()
    await db.refresh(source)
    return {"id": source.id, "name": source.name, "columns": source.columns_meta, "row_count": source.row_count, "status": source.status, "created_at": source.created_at.isoformat() if source.created_at else None}


@router.delete("/{id}", response_model=DeleteResponse)
async def delete_source(id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """Delete a data source"""
    result = await db.execute(select(DataSource).where(DataSource.id == id, DataSource.user_id == user.id))
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(404, "Not found")
    
    data_type = source.data_type
    file_path = source.file_path
    
    # Delete dashboard_data FIRST (foreign key constraint)
    if data_type == "dashboard":
        await db.execute(delete(DashboardData).where(DashboardData.source_id == id))
    
    await db.delete(source)
    await db.commit()
    
    # Delete file after DB commit
    if file_path and os.path.exists(file_path):
        os.remove(file_path)

    # Clear dashboard cache
    try:
        await cache_delete("dashboard:*")
    except:
        pass
    
    return {"ok": True}
