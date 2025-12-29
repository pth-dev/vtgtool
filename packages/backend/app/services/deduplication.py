"""
Deduplication Service for Production Order data.

This service handles removing duplicate Production Orders across different
reporting days, keeping records from the most recent reporting day only.

IMPORTANT: Same Production Order No. on the SAME day should be kept (counted each time).
Only remove duplicates when the SAME Production Order No. appears on DIFFERENT days
(keep only the latest day).
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
    - Same Production Order No. + Same Reporting day → KEEP ALL (count each occurrence)
    - Same Production Order No. + Different Reporting day → Keep only the LATEST day's records
    - Records with NULL Production Order No. are not deduplicated
    - Exact string matching is used (case-sensitive)
    """
    
    PRODUCTION_ORDER_COL = 'Production Order No.'
    REPORTING_DAY_COL = 'Reporting day'
    
    @staticmethod
    def deduplicate_dataframe(df: pd.DataFrame) -> tuple[pd.DataFrame, DeduplicationResult]:
        """
        Deduplicate DataFrame by keeping only records from the latest Reporting day 
        for each Production Order No. Records with same PON on same day are ALL kept.
        
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
        
        # Find the latest reporting day for each Production Order No.
        latest_days = df_non_null.groupby(DeduplicationService.PRODUCTION_ORDER_COL)[
            DeduplicationService.REPORTING_DAY_COL
        ].max().reset_index()
        latest_days.columns = [DeduplicationService.PRODUCTION_ORDER_COL, '_latest_day']
        
        # Merge to get latest day for each row
        df_with_latest = df_non_null.merge(latest_days, on=DeduplicationService.PRODUCTION_ORDER_COL)
        
        # Keep only rows where reporting_day == latest_day for that PON
        # This keeps ALL records from the latest day (including duplicates on same day)
        df_deduped = df_with_latest[
            df_with_latest[DeduplicationService.REPORTING_DAY_COL] == df_with_latest['_latest_day']
        ].drop(columns=['_latest_day'])
        
        # Build duplicate details for logging (records removed from older days)
        duplicate_details = []
        removed_records = df_with_latest[
            df_with_latest[DeduplicationService.REPORTING_DAY_COL] != df_with_latest['_latest_day']
        ]
        
        for order_no in removed_records[DeduplicationService.PRODUCTION_ORDER_COL].unique():
            removed_dates = removed_records[
                removed_records[DeduplicationService.PRODUCTION_ORDER_COL] == order_no
            ][DeduplicationService.REPORTING_DAY_COL].unique().tolist()
            
            duplicate_details.append({
                'production_order': str(order_no),
                'dates_removed': [str(d) for d in removed_dates]
            })
            logger.info(f"Duplicate found: {order_no} - removing older dates: {removed_dates}")
        
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
        from ALL sources.
        
        IMPORTANT: Keep ALL records from the LATEST reporting day for each PON.
        Only remove records from OLDER days when the same PON exists on a newer day.
        
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
        
        # Delete records from OLDER days when same PON exists on a NEWER day
        # Keep ALL records from the latest day (including multiple occurrences on same day)
        delete_sql = text("""
            DELETE FROM dashboard_data d
            WHERE d.production_order_no IS NOT NULL
            AND d.reporting_day < (
                SELECT MAX(d2.reporting_day)
                FROM dashboard_data d2
                WHERE d2.production_order_no = d.production_order_no
            )
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
                f"({duplicates_removed} removed from older days)"
            )
        else:
            logger.info("No duplicates found in database")
        
        return DeduplicationResult(
            original_count=count_before,
            duplicates_removed=duplicates_removed,
            final_count=count_after,
            duplicate_details=[]
        )
