"""
Dashboard API routes
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import logging

from app.core.database import get_db
from app.core.cache import cache_get, cache_set
from app.core.exceptions import DashboardException
from app.schemas.dashboard import (
    DashboardResponse,
    DecompositionResponse,
    ComparisonResponse,
    FailureTrendResponse,
    DrilldownResponse,
)
from .service import DashboardService

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("", response_model=DashboardResponse)
async def get_dashboard(
    db: AsyncSession = Depends(get_db),
    month: Optional[str] = Query(None),
    customers: Optional[str] = Query(None),
    categories: Optional[str] = Query(None),
    statuses: Optional[str] = Query(None),
    products: Optional[str] = Query(None)
):
    """Get main dashboard data with KPIs, charts, and filters"""
    try:
        # Granular cache key with versioning
        cache_key = f"dashboard:v1:{month}:{customers}:{categories}:{statuses}:{products}"
        cached = await cache_get(cache_key)
        if cached: return cached

        service = DashboardService(db)
        data = await service.get_dashboard_data(
            month=month,
            customers=customers,
            categories=categories,
            statuses=statuses,
            products=products
        )
        
        await cache_set(cache_key, data, ttl=300)
        return data

    except Exception as e:
        logger.error(f"Dashboard Error: {e}")
        raise DashboardException(f"Failed to load dashboard: {str(e)}")


@router.get("/decomposition", response_model=DecompositionResponse)
async def get_decomposition_data(
    db: AsyncSession = Depends(get_db),
    month: Optional[str] = Query(None),
):
    """Get hierarchical decomposition tree data"""
    cache_key = f"dashboard:decomposition:v1:{month}"
    cached = await cache_get(cache_key)
    if cached: return cached

    service = DashboardService(db)
    response = await service.get_decomposition_data(month=month)
    
    await cache_set(cache_key, response, ttl=300)
    return response


@router.get("/comparison", response_model=ComparisonResponse)
async def get_comparison_data(
    db: AsyncSession = Depends(get_db),
    months: int = Query(6, ge=2, le=12),
):
    """Get monthly comparison data"""
    cache_key = f"dashboard:comparison:v1:{months}"
    cached = await cache_get(cache_key)
    if cached: return cached

    service = DashboardService(db)
    response = await service.get_comparison_data(months=months)
    
    await cache_set(cache_key, response, ttl=300)
    return response


@router.get("/failure-trend", response_model=FailureTrendResponse)
async def get_failure_trend(
    db: AsyncSession = Depends(get_db),
    months: int = Query(6, ge=1, le=12),
):
    """Get failure trend data"""
    cache_key = f"dashboard:failure_trend:v1:{months}"
    cached = await cache_get(cache_key)
    if cached: return cached

    service = DashboardService(db)
    response = await service.get_failure_trend(months=months)
    
    await cache_set(cache_key, response, ttl=300)
    return response


@router.get("/drilldown", response_model=DrilldownResponse)
async def get_drilldown_data(
    db: AsyncSession = Depends(get_db),
    dimension: str = Query(..., description="customer or category"),
    value: str = Query(..., description="The value to filter by"),
    month: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
):
    """Get drilldown data for specific dimension"""
    service = DashboardService(db)
    return await service.get_drilldown_data(
        dimension=dimension,
        value=value,
        month=month,
        page=page,
        page_size=page_size
    )
