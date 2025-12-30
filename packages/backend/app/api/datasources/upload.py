"""
Datasources upload processing functions
"""
import os
import pandas as pd
from datetime import datetime
import logging

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert

from app.core.database import async_session
from app.core.cache import cache_delete
from app.models.models import DataSource, DashboardData
from app.services.data_processor import FileParser, SchemaDetector, DataValidator
from app.services.deduplication import DeduplicationService

logger = logging.getLogger(__name__)


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
                    # Step 1: Deduplicate within the uploaded file
                    df_new, file_dedup_result = DeduplicationService.deduplicate_dataframe(df_new)
                    logger.info(f"File deduplication for source {source_id}: removed {file_dedup_result.duplicates_removed} duplicates")
                    
                    # Map DataFrame columns to DashboardData model
                    column_mapping = {
                        'Reporting day': 'reporting_day',
                        'Production Order No.': 'production_order_no',
                        'Customer': 'customer',
                        'Category': 'category',
                        'Product': 'product',
                        'Status': 'status',
                        'Current status': 'current_status',
                        'Currrent status': 'current_status',  # Handle typo
                        'Production No': 'production_no',
                        'Root cause': 'root_cause',
                        'Improvement plan': 'improvement_plan'
                    }

                    # Prepare data for insertion
                    db_data = []
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
                                elif db_col == 'production_order_no':
                                    # Ensure string
                                    val = str(val).strip() if val else None
                                record[db_col] = val
                        db_data.append(record)
                    
                    if db_data:
                        # Chunked insert to avoid packet size issues
                        chunk_size = 1000
                        for i in range(0, len(db_data), chunk_size):
                            await db.execute(insert(DashboardData), db_data[i:i + chunk_size])
                        
                        await db.commit()
                        logger.info(f"Successfully inserted {len(db_data)} records for source {source_id}")
                        
                        # Step 2: Deduplicate against existing data from other sources
                        db_dedup_result = await DeduplicationService.deduplicate_against_existing(db, source_id)
                        logger.info(f"DB deduplication for source {source_id}: removed {db_dedup_result.duplicates_removed} duplicates across all sources")

                # ---------------------------------------------
                
                schema = SchemaDetector.detect_schema(df_new)
                validation = DataValidator.validate(df_new)
                
                # Update source info
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
            logger.error(f"Fatal error in background upload task for source {source_id}: {e}", exc_info=True)
