from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert, delete, func
import os, uuid
import pandas as pd
import logging
from app.core.database import get_db, async_session
from app.core.config import settings
from app.core.cache import cache_delete
from app.models.models import User, DataSource, DashboardData
from app.api.auth import get_current_user
from app.schemas.schemas import DataSourceResponse
from app.services.data_processor import FileParser, SchemaDetector, DataValidator

logger = logging.getLogger(__name__)
router = APIRouter()

def normalize_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Normalize data types: Reporting day -> date, Production No -> number"""
    if 'Reporting day' in df.columns:
        df['Reporting day'] = pd.to_datetime(df['Reporting day'], errors='coerce').dt.strftime('%Y-%m-%d')
    if 'Production No' in df.columns:
        df['Production No'] = pd.to_numeric(df['Production No'], errors='coerce').fillna(0).astype(int)
    return df

def process_isc_data(df: pd.DataFrame) -> pd.DataFrame:
    """Process ISC data: only keep Item code and Avg Consume, convert Avg Consume to positive"""
    required_cols = ['Item code', 'Avg Consume']
    
    # Check required columns exist
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")
    
    # Only keep required columns
    df_result = df[required_cols].copy()
    
    # Convert Avg Consume to positive number, preserve original precision
    df_result['Avg Consume'] = pd.to_numeric(df_result['Avg Consume'], errors='coerce').abs()
    
    return df_result

async def process_upload_task(source_id: int, file_path: str, data_type: str):
    """Background task to process uploaded file"""
    async with async_session() as db:
        try:
            # Fetch source
            result = await db.execute(select(DataSource).where(DataSource.id == source_id))
            source = result.scalar_one_or_none()
            if not source:
                return

            try:
                df_new = FileParser.parse(file_path)
                
                # Process based on data_type
                if data_type == "isc":
                    df_new = process_isc_data(df_new)
                else:
                    df_new = normalize_dataframe(df_new)

                # --- Database Ingestion for Dashboard Data ---
                if data_type == "dashboard":
                    # Map DataFrame columns to DashboardData model
                    column_mapping = {
                        'Reporting day': 'reporting_day',
                        'Customer': 'customer',
                        'Category': 'category',
                        'Product': 'product',
                        'Status': 'status',
                        'Current status': 'current_status',
                        'Currrent status': 'current_status', # Handle typo
                        'Production No': 'production_no',
                        'Root cause': 'root_cause',
                        'Improvement plan': 'improvement_plan'
                    }

                    # Prepare data for insertion
                    # FIX: Use vectorized operations instead of slow iterrows()
                    db_data = []
                    
                    from datetime import datetime
                    # Convert entire DataFrame to dict records at once (much faster)
                    records = df_new.to_dict('records')
                    
                    for row in records:
                        record = {'source_id': source_id}
                        for csv_col, db_col in column_mapping.items():
                            if csv_col in row:
                                val = row[csv_col]
                                if pd.isna(val):
                                    val = None
                                elif db_col == 'reporting_day' and val:
                                    # Convert string to date
                                    try:
                                        val = datetime.strptime(str(val)[:10], '%Y-%m-%d').date()
                                    except (ValueError, TypeError):
                                        val = None
                                elif db_col == 'production_no':
                                    # Ensure integer
                                    try:
                                        val = int(float(val)) if val else 0
                                    except (ValueError, TypeError):
                                        val = 0
                                record[db_col] = val
                        db_data.append(record)
                    
                    if db_data:
                        # Chunked insert to avoid packet size issues if file is large
                        chunk_size = 1000
                        for i in range(0, len(db_data), chunk_size):
                            await db.execute(insert(DashboardData), db_data[i:i + chunk_size])
                        
                        # Commit after all chunks
                        await db.commit()
                        logger.info(f"Successfully inserted {len(db_data)} records for source {source_id}")

                # ---------------------------------------------
                
                schema = SchemaDetector.detect_schema(df_new)
                validation = DataValidator.validate(df_new)
                
                # Update source info - wrapped in transaction
                source.row_count = validation["row_count"]
                source.column_count = validation["column_count"]
                source.columns_meta = schema
                source.status = "ready"
                await db.commit()
                logger.info(f"Source {source_id} processed successfully: {source.row_count} rows")
                
                # Clear dashboard cache
                try:
                    await cache_delete("dashboard:*")
                except Exception as cache_err:
                    logger.warning(f"Failed to clear cache: {cache_err}")
                    
            except Exception as e:
                logger.error(f"Error processing file for source {source_id}: {e}", exc_info=True)
                # Rollback transaction on error
                await db.rollback()
                source.status = "error"
                source.error_message = str(e)
                await db.commit()
                
                # Clean up file on error
                if os.path.exists(file_path):
                    try:
                        os.remove(file_path)
                        logger.info(f"Cleaned up file after error: {file_path}")
                    except OSError as rm_err:
                        logger.warning(f"Failed to remove file {file_path}: {rm_err}")
            
        except Exception as e:
            # Fatal error
            logger.error(f"Fatal error in background upload task for source {source_id}: {e}", exc_info=True)

@router.post("/upload", response_model=DataSourceResponse)
async def upload(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    data_type: str = Query("dashboard", regex="^(dashboard|isc)$"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ['.csv', '.xlsx', '.xls', '.json']:
        raise HTTPException(400, "Unsupported file type")
    
    # Save uploaded file temporarily
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    content = await file.read()
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

@router.get("")
async def list_sources(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str = Query(None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    # Build base query
    query = select(DataSource).where(DataSource.user_id == user.id)
    if search:
        query = query.where(DataSource.name.ilike(f"%{search}%"))
    
    # Fix N+1: Use proper COUNT query instead of loading all records
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query) or 0
    
    # Fetch paginated data
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

@router.get("/{id}")
async def get_source(id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(select(DataSource).where(DataSource.id == id, DataSource.user_id == user.id))
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(404, "Not found")
    return {
        "id": source.id, "name": source.name, "file_type": source.file_type, "columns": source.columns_meta,
        "row_count": source.row_count, "column_count": source.column_count, "data_type": source.data_type,
        "status": source.status, "created_at": source.created_at.isoformat() if source.created_at else None
    }

@router.get("/{id}/preview")
async def preview(id: int, rows: int = Query(100, ge=1, le=500), db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(select(DataSource).where(DataSource.id == id, DataSource.user_id == user.id))
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(404, "Not found")
    if not os.path.exists(source.file_path):
        raise HTTPException(404, "File not found on server")
    df = FileParser.parse(source.file_path)
    preview_df = df.head(rows).fillna("")
    return {"columns": source.columns_meta, "data": preview_df.to_dict(orient="records"), "total_rows": source.row_count, "preview_rows": min(rows, source.row_count or 0)}

@router.get("/{id}/data")
async def get_data(
    id: int, page: int = Query(1, ge=1), page_size: int = Query(50, ge=1, le=500),
    sort_by: str = Query(None), sort_order: str = Query("asc"), search: str = Query(None),
    db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)
):
    result = await db.execute(select(DataSource).where(DataSource.id == id, DataSource.user_id == user.id))
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(404, "Not found")
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

@router.get("/{id}/validate")
async def validate_source(id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(select(DataSource).where(DataSource.id == id, DataSource.user_id == user.id))
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(404, "Not found")
    if not os.path.exists(source.file_path):
        raise HTTPException(404, "File not found")
    df = FileParser.parse(source.file_path)
    return DataValidator.validate(df)

@router.get("/{id}/schema")
async def detect_schema(id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(select(DataSource).where(DataSource.id == id, DataSource.user_id == user.id))
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(404, "Not found")
    if not os.path.exists(source.file_path):
        raise HTTPException(404, "File not found")
    df = FileParser.parse(source.file_path)
    return {"schema": SchemaDetector.detect_schema(df)}

@router.post("/{id}/process")
async def process_source(id: int, name: str = Query(None), db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
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

@router.delete("/{id}")
async def delete_source(id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(select(DataSource).where(DataSource.id == id, DataSource.user_id == user.id))
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(404, "Not found")
    
    data_type = source.data_type
    file_path = source.file_path
    
    # Delete dashboard_data FIRST (foreign key constraint)
    if data_type == "dashboard":
        await db.execute(delete(DashboardData).where(DashboardData.source_id == id))
    
    # Then delete data_source
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
