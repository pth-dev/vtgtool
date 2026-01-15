"""
Dashboard queries - database query functions
"""
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, case, or_
from app.models.models import DashboardData


def apply_filters(query, month=None, customers=None, categories=None, statuses=None, products=None):
    """Apply common filters to dashboard queries"""
    if month:
        # Postgres to_char for YYYY-MM
        query = query.where(func.to_char(DashboardData.reporting_day, 'YYYY-MM') == month)
    
    if customers:
        customer_list = [c.strip() for c in customers.split(',')]
        query = query.where(DashboardData.customer.in_(customer_list))
    
    if categories:
        cat_list = [c.strip() for c in categories.split(',')]
        if 'Blank' in cat_list:
            # Handle Blank as None or empty string if needed
            query = query.where(or_(DashboardData.category.in_(cat_list), DashboardData.category.is_(None)))
        else:
            query = query.where(DashboardData.category.in_(cat_list))
            
    if statuses:
        status_list = [s.strip() for s in statuses.split(',')]
        query = query.where(DashboardData.status.in_(status_list))
        
    if products:
        product_list = [p.strip() for p in products.split(',')]
        query = query.where(DashboardData.product.in_(product_list))
        
    return query


async def get_available_months(db: AsyncSession) -> List[str]:
    """Get list of available months in YYYY-MM format"""
    result = await db.execute(
        select(func.to_char(DashboardData.reporting_day, 'YYYY-MM').label('month'))
        .distinct()
        .order_by(desc('month'))
    )
    return [r for r in result.scalars().all() if r]


async def calculate_metrics(db: AsyncSession, filters: dict) -> dict:
    """Calculate dashboard KPI metrics"""
    stmt = select(
        func.sum(DashboardData.production_no).label('total_prod'),
        func.count(DashboardData.id).label('total_rows'),
        func.sum(case((DashboardData.status == 'LOCK', DashboardData.production_no), else_=0)).label('lock_prod'),
        func.sum(case((DashboardData.status == 'HOLD', DashboardData.production_no), else_=0)).label('hold_prod'),
        func.sum(case((DashboardData.status == 'FAILURE', DashboardData.production_no), else_=0)).label('fail_prod'),
        func.sum(case((DashboardData.current_status == 'CANCELED', DashboardData.production_no), else_=0)).label('cancel_prod'),
        
        # Count versions for fallback
        func.count(case((DashboardData.status == 'LOCK', 1))).label('lock_count'),
        func.count(case((DashboardData.status == 'HOLD', 1))).label('hold_count'),
        func.count(case((DashboardData.status == 'FAILURE', 1))).label('fail_count'),
        func.count(case((DashboardData.current_status == 'CANCELED', 1))).label('cancel_count'),
    )
    stmt = apply_filters(stmt, **filters)
    result = await db.execute(stmt)
    row = result.one()
    
    # Use Production No sum if available (>0), else use row counts
    total = row.total_prod or 0
    if total == 0 and (row.total_rows or 0) > 0:
        total = row.total_rows or 0
        lock = row.lock_count or 0
        hold = row.hold_count or 0
        failure = row.fail_count or 0
        canceled = row.cancel_count or 0
    else:
        lock = row.lock_prod or 0
        hold = row.hold_prod or 0
        failure = row.fail_prod or 0
        canceled = row.cancel_prod or 0

    resume_success_rate = round((total - canceled) / total * 100, 1) if total else 0
    lock_rate = round(lock / total * 100, 1) if total else 0
    hold_rate = round(hold / total * 100, 1) if total else 0
    failure_rate = round(canceled / total * 100, 1) if total else 0

    return {
        "total_orders": int(total),
        "lock_count": int(lock),
        "lock_rate": lock_rate,
        "hold_count": int(hold),
        "hold_rate": hold_rate,
        "failure_count": int(failure),
        "failure_rate": failure_rate,
        "resume_success_rate": resume_success_rate,
    }


async def get_top_item(db: AsyncSession, column, filters):
    """Get top item by count using window function for single query"""
    # Use window function to get count and total in single query
    stmt = select(
        column,
        func.count(DashboardData.id).label('cnt'),
        func.sum(func.count(DashboardData.id)).over().label('total')
    )
    stmt = apply_filters(stmt, **filters)
    stmt = stmt.group_by(column).order_by(desc('cnt')).limit(1)
    result = await db.execute(stmt)
    row = result.first()
    
    if row and row.total > 0:
        return {"name": str(row[0]), "percent": round(row.cnt / row.total * 100, 1)}
    return None


async def get_chart_data(db: AsyncSession, column, filters):
    """Get chart data grouped by column"""
    stmt = select(column, func.count(DashboardData.id).label('cnt'))
    stmt = apply_filters(stmt, **filters)
    stmt = stmt.group_by(column).order_by(desc('cnt'))
    result = await db.execute(stmt)
    rows = result.all()
    
    total = sum(r.cnt for r in rows) if rows else 0
    return [{"name": str(r[0]) if r[0] is not None else "Blank", "count": int(r.cnt), "percent": round(r.cnt / total * 100, 1) if total else 0} for r in rows]
