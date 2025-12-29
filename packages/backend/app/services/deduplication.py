"""
Deduplication Service for Production Order data.

This service handles removing duplicate Production Orders across different
reporting days, keeping only the record with the most recent reporting day.
"""

from dataclasses import dataclass, field
from typing import Optional
import pandas as pd
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
import logging

logger = logging.getLogger(__name__)


@dataclass
class DeduplicationResult:
    """Result of a deduplication operation"""
    original_count: int
    duplicates_removed: int
    final_count: int
    duplicate_details: list[dict] = field(default_factory=list)
    
    def __post_init__(self):
        # Validate invariant: original - removed = final
        assert self.original_count - self.duplicates_removed == self.final_count, \
            f"Statistics mismatch: {self.original_count} - {self.duplicates_removed} != {self.final_count}"


class DeduplicationService:
    """
    Service to handle Production Order deduplication.
    
    Deduplication rules:
    - For each unique Production Order No., keep only the record with the latest Reporting day
    - Records with NULL Production Order No. are not deduplicated
    - Exact string matching is used (case-sensitive)
    """
    
    PRODUCTION_ORDER_COL = 'Production Order No.'
    REPORTING_DAY_COL = 'Reporting day'
    
    @staticmethod
    def deduplicate_dataframe(df: pd.DataFrame) -> tuple[pd.DataFrame, DeduplicationResult]:
        """
        Deduplicate DataFrame by keeping only the latest Reporting day 
        for each Production Order No.
        
        Args:
            df: DataFrame with 'Production Order No.' and 'Reporting day' columns
            
        Returns:
            Tuple of (deduplicated DataFrame, DeduplicationResult)
        """
        original_count = len(df)
        
        # Check required columns exist
        if DeduplicationService.PRODUCTION_ORDER_COL not in df.columns:
            logger.warning(f"Column '{DeduplicationService.PRODUCTION_ORDER_COL}' not found, skipping deduplication")
            return df, DeduplicationResult(
                original_count=original_count,
                duplicates_removed=0,
                final_count=original_count,
                duplicate_details=[]
            )
        
        if DeduplicationService.REPORTING_DAY_COL not in df.columns:
            logger.warning(f"Column '{DeduplicationService.REPORTING_DAY_COL}' not found, skipping deduplication")
            return df, DeduplicationResult(
                original_count=original_count,
                duplicates_removed=0,
                final_count=original_count,
                duplicate_details=[]
            )
        
        # Handle empty DataFrame
        if original_count == 0:
            return df, DeduplicationResult(
                original_count=0,
                duplicates_removed=0,
                final_count=0,
                duplicate_details=[]
            )
        
        # Separate records with NULL Production Order No. (don't deduplicate these)
        null_mask = df[DeduplicationService.PRODUCTION_ORDER_COL].isna()
        df_null = df[null_mask].copy()
        df_non_null = df[~null_mask].copy()
        
        if len(df_non_null) == 0:
            return df, DeduplicationResult(
                original_count=original_count,
                duplicates_removed=0,
                final_count=original_count,
                duplicate_details=[]
            )
        
        # Sort by Reporting day descending so latest comes first
        df_sorted = df_non_null.sort_values(
            DeduplicationService.REPORTING_DAY_COL, 
            ascending=False
        )
        
        # Find duplicates before removing (for logging)
        duplicates = df_sorted[
            df_sorted.duplicated(DeduplicationService.PRODUCTION_ORDER_COL, keep='first')
        ]
        
        # Build duplicate details for logging
        duplicate_details = []
        for order_no in duplicates[DeduplicationService.PRODUCTION_ORDER_COL].unique():
            removed_dates = duplicates[
                duplicates[DeduplicationService.PRODUCTION_ORDER_COL] == order_no
            ][DeduplicationService.REPORTING_DAY_COL].tolist()
            
            duplicate_details.append({
                'production_order': str(order_no),
                'dates_removed': [str(d) for d in removed_dates]
            })
            logger.info(f"Duplicate found: {order_no} - removing dates: {removed_dates}")
        
        # Remove duplicates, keep first (latest date)
        df_deduped = df_sorted.drop_duplicates(
            DeduplicationService.PRODUCTION_ORDER_COL, 
            keep='first'
        )
        
        # Combine with NULL records
        df_result = pd.concat([df_deduped, df_null], ignore_index=True)
        
        # Sort by Reporting day ascending (restore chronological order)
        if DeduplicationService.REPORTING_DAY_COL in df_result.columns:
            df_result = df_result.sort_values(
                DeduplicationService.REPORTING_DAY_COL, 
                ascending=True
            ).reset_index(drop=True)
        
        duplicates_removed = original_count - len(df_result)
        
        logger.info(f"DataFrame deduplication: {original_count} -> {len(df_result)} records ({duplicates_removed} removed)")
        
        return df_result, DeduplicationResult(
            original_count=original_count,
            duplicates_removed=duplicates_removed,
            final_count=len(df_result),
            duplicate_details=duplicate_details
        )
    
    @staticmethod
    async def deduplicate_against_existing(
        db: AsyncSession, 
        new_source_id: Optional[int] = None
    ) -> DeduplicationResult:
        """
        After inserting new records, deduplicate against existing records 
        from ALL sources. Keeps the record with latest Reporting day.
        
        Args:
            db: Database session
            new_source_id: ID of the newly uploaded source (for logging)
            
        Returns:
            DeduplicationResult with statistics
        """
        from app.models.models import DashboardData
        
        # Count before
        count_before_result = await db.execute(
            select(func.count()).select_from(DashboardData)
        )
        count_before = count_before_result.scalar() or 0
        
        if count_before == 0:
            return DeduplicationResult(
                original_count=0,
                duplicates_removed=0,
                final_count=0,
                duplicate_details=[]
            )
        
        # Delete duplicates using PostgreSQL DISTINCT ON
        # Keep the record with latest reporting_day for each production_order_no
        # If same date, keep the one with highest id (most recently inserted)
        delete_sql = text("""
            DELETE FROM dashboard_data d
            WHERE d.id NOT IN (
                SELECT DISTINCT ON (production_order_no) id
                FROM dashboard_data
                WHERE production_order_no IS NOT NULL
                ORDER BY production_order_no, reporting_day DESC NULLS LAST, id DESC
            )
            AND d.production_order_no IS NOT NULL
        """)
        
        result = await db.execute(delete_sql)
        duplicates_removed = result.rowcount
        
        await db.commit()
        
        # Count after
        count_after_result = await db.execute(
            select(func.count()).select_from(DashboardData)
        )
        count_after = count_after_result.scalar() or 0
        
        if duplicates_removed > 0:
            logger.info(
                f"Database deduplication: {count_before} -> {count_after} records "
                f"({duplicates_removed} removed)"
            )
        else:
            logger.info("No duplicates found in database")
        
        return DeduplicationResult(
            original_count=count_before,
            duplicates_removed=duplicates_removed,
            final_count=count_after,
            duplicate_details=[]
        )
