from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, case, or_
from typing import Optional, List
from app.core.database import get_db
from app.core.cache import cache_get, cache_set
from app.models.models import DashboardData
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

def clean_for_json(obj):
    """Replace NaN/Inf with None for JSON serialization"""
    if isinstance(obj, dict):
        return {k: clean_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_for_json(v) for v in obj]
    elif isinstance(obj, float):
        import math
        if math.isnan(obj) or math.isinf(obj):
            return None
    return obj

# --- Helpers ---

def apply_filters(query, month=None, customers=None, categories=None, statuses=None, products=None):
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
    result = await db.execute(
        select(func.to_char(DashboardData.reporting_day, 'YYYY-MM').label('month'))
        .distinct()
        .order_by(desc('month'))
    )
    return [r for r in result.scalars().all() if r]

def calc_mom_change(current: dict, prev: dict) -> dict:
    if not prev or not current:
        return {}
    
    def pct_change(curr, prv):
        if not prv: return None
        return round((curr - prv) / prv * 100, 1)
    
    def pts_change(curr, prv):
        if prv is None: return None
        return round(curr - prv, 1)
    
    return {
        "total_orders": pct_change(current.get("total_orders", 0), prev.get("total_orders", 0)),
        "lock_count": pct_change(current.get("lock_count", 0), prev.get("lock_count", 0)),
        "hold_count": pct_change(current.get("hold_count", 0), prev.get("hold_count", 0)),
        "failure_count": pct_change(current.get("failure_count", 0), prev.get("failure_count", 0)),
        "resume_success_rate": pts_change(current.get("resume_success_rate", 0), prev.get("resume_success_rate", 0)),
        "hold_rate": pts_change(current.get("hold_rate", 0), prev.get("hold_rate", 0)),
        "failure_rate": pts_change(current.get("failure_rate", 0), prev.get("failure_rate", 0)),
    }

async def calculate_metrics(db: AsyncSession, filters: dict) -> dict:
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
    hold_rate = round(hold / total * 100, 1) if total else 0
    failure_rate = round(canceled / total * 100, 1) if total else 0

    return {
        "total_orders": int(total),
        "lock_count": int(lock),
        "hold_count": int(hold),
        "failure_count": int(failure),
        "resume_success_rate": resume_success_rate,
        "hold_rate": hold_rate,
        "failure_rate": failure_rate,
    }

async def get_top_item(db: AsyncSession, column, filters):
    stmt = select(column, func.count(DashboardData.id).label('cnt'))
    stmt = apply_filters(stmt, **filters)
    stmt = stmt.group_by(column).order_by(desc('cnt')).limit(1)
    result = await db.execute(stmt)
    row = result.first()
    
    total_stmt = select(func.count(DashboardData.id))
    total_stmt = apply_filters(total_stmt, **filters)
    total_res = await db.execute(total_stmt)
    total = total_res.scalar() or 0
    
    if row and total > 0:
        return {"name": str(row[0]), "percent": round(row[1] / total * 100, 1)}
    return None

async def get_chart_data(db: AsyncSession, column, filters):
    stmt = select(column, func.count(DashboardData.id).label('cnt'))
    stmt = apply_filters(stmt, **filters)
    stmt = stmt.group_by(column).order_by(desc('cnt'))
    result = await db.execute(stmt)
    rows = result.all()
    
    total = sum(r.cnt for r in rows) if rows else 0
    return [{"name": str(r[0]) if r[0] is not None else "Blank", "count": int(r.cnt), "percent": round(r.cnt / total * 100, 1) if total else 0} for r in rows]

# --- Endpoints ---

@router.get("")
async def get_dashboard(
    db: AsyncSession = Depends(get_db),
    month: Optional[str] = Query(None),
    customers: Optional[str] = Query(None),
    categories: Optional[str] = Query(None),
    statuses: Optional[str] = Query(None),
    products: Optional[str] = Query(None)
):
    try:
        # Granular cache key with versioning
        cache_key = f"dashboard:v1:{month}:{customers}:{categories}:{statuses}:{products}"
        cached = await cache_get(cache_key)
        if cached: return cached

        available_months = await get_available_months(db)
        selected_month = month or (available_months[0] if available_months else None)
        
        # Determine previous month
        prev_month = None
        if selected_month and selected_month in available_months:
            idx = available_months.index(selected_month)
            if idx + 1 < len(available_months):
                prev_month = available_months[idx + 1]

        # Filters for current query
        current_filters = {
            "month": selected_month,
            "customers": customers,
            "categories": categories,
            "statuses": statuses,
            "products": products
        }

        # KPIs
        kpis = await calculate_metrics(db, current_filters)
        
        # Previous Month KPIs (only filtering by month, keeping other filters? usually MoM compares same segment)
        prev_filters = current_filters.copy()
        prev_filters["month"] = prev_month
        prev_kpis = await calculate_metrics(db, prev_filters) if prev_month else {}
        
        mom_change = calc_mom_change(kpis, prev_kpis)

        # Top Items
        kpis["top_category"] = await get_top_item(db, DashboardData.category, current_filters)
        kpis["top_customer"] = await get_top_item(db, DashboardData.customer, current_filters)

        # Charts
        charts = {
            "by_customer": await get_chart_data(db, DashboardData.customer, current_filters),
            "by_category": await get_chart_data(db, DashboardData.category, current_filters),
            "by_status": await get_chart_data(db, DashboardData.status, current_filters),
        }

        # Trend Chart
        trend_stmt = select(
            func.to_char(DashboardData.reporting_day, 'YYYY-MM-DD').label('day'),
            DashboardData.status,
            func.count(DashboardData.id)
        )
        trend_stmt = apply_filters(trend_stmt, **current_filters)
        trend_stmt = trend_stmt.group_by('day', DashboardData.status).order_by('day')
        trend_res = await db.execute(trend_stmt)
        
        # Process trend data into expected format
        trend_data = {}
        for day, status, count in trend_res.all():
            if day not in trend_data: trend_data[day] = {"date": day}
            trend_data[day][status] = count
        charts["trend"] = list(trend_data.values())

        # Root Causes
        rc_stmt = select(
            DashboardData.root_cause, 
            func.count(DashboardData.id).label('cnt'),
            func.max(DashboardData.improvement_plan).label('imp_plan') # Just take one if multiple
        )
        rc_stmt = apply_filters(rc_stmt, **current_filters)
        rc_stmt = rc_stmt.where(DashboardData.root_cause.is_not(None))
        rc_stmt = rc_stmt.group_by(DashboardData.root_cause).order_by(desc('cnt')).limit(20)
        rc_res = await db.execute(rc_stmt)
        
        total_rows = kpis["total_orders"] # Approx base
        root_causes = [
            {
                "root_cause": r.root_cause,
                "count": int(r.cnt),
                "improvement_plan": r.imp_plan,
                "percent": round(r.cnt / total_rows * 100, 1) if total_rows else 0
            } for r in rc_res.all()
        ]

        # Filter Options (Distinct values for dropdowns, scoped to selected month usually or global?)
        # Original code scoped to selected month.
        async def get_distinct_vals(col):
            q = select(col).distinct().order_by(col)
            if selected_month:
                q = q.where(func.to_char(DashboardData.reporting_day, 'YYYY-MM') == selected_month)
            res = await db.execute(q)
            return [str(r) for r in res.scalars().all() if r is not None]

        filter_options = {
            "months": available_months,
            "customers": await get_distinct_vals(DashboardData.customer),
            "categories": await get_distinct_vals(DashboardData.category),
            "statuses": await get_distinct_vals(DashboardData.status),
            "products": await get_distinct_vals(DashboardData.product),
        }

        response = {
            "kpis": kpis,
            "prev_month_kpis": prev_kpis,
            "mom_change": mom_change,
            "charts": charts,
            "root_causes": root_causes,
            "filters": filter_options,
            "selected_month": selected_month,
            "prev_month": prev_month,
        }
        
        cleaned_response = clean_for_json(response)
        await cache_set(cache_key, cleaned_response, ttl=300)
        return cleaned_response

    except Exception as e:
        print(f"Dashboard Error: {e}")
        return {"kpis": {}, "charts": {}, "filters": {}, "error": str(e)}

@router.get("/decomposition")
async def get_decomposition_data(
    db: AsyncSession = Depends(get_db),
    month: Optional[str] = Query(None),
):
    """Get hierarchical decomposition tree data"""
    cache_key = f"dashboard:decomposition:v1:{month}"
    cached = await cache_get(cache_key)
    if cached: return cached

    available_months = await get_available_months(db)
    selected_month = month or (available_months[0] if available_months else None)
    
    if not selected_month:
        return {"data": {"name": "Total", "value": 0, "children": []}}

    # Fetch grouped data efficiently
    stmt = select(
        DashboardData.status,
        DashboardData.customer,
        DashboardData.category,
        DashboardData.root_cause,
        func.count(DashboardData.id).label('cnt')
    ).where(func.to_char(DashboardData.reporting_day, 'YYYY-MM') == selected_month)
    stmt = stmt.group_by(DashboardData.status, DashboardData.customer, DashboardData.category, DashboardData.root_cause)
    result = await db.execute(stmt)
    rows = result.all()
    
    total = sum(r.cnt for r in rows)
    tree = {"name": "Total", "value": total, "children": []}
    
    # Process into tree structure
    # Structure: Status -> Customer -> Category -> Root Cause
    # We can use nested dictionaries to build this
    
    data_map = {}
    
    for status, customer, category, root_cause, count in rows:
        if not status: continue
        customer = customer or "Blank"
        category = category or "Unknown"
        root_cause = root_cause or "Unknown"
        
        if status not in data_map: data_map[status] = {}
        if customer not in data_map[status]: data_map[status][customer] = {}
        if category not in data_map[status][customer]: data_map[status][customer][category] = {}
        
        data_map[status][customer][category][root_cause] = data_map[status][customer][category].get(root_cause, 0) + count

    for status, customers in data_map.items():
        status_total = sum(sum(sum(rc.values()) for rc in cats.values()) for cats in customers.values())
        status_node = {
            "name": status, 
            "value": status_total, 
            "percent": round(status_total/total*100, 1) if total else 0,
            "children": []
        }
        
        for cust, categories in customers.items():
            cust_total = sum(sum(rc.values()) for rc in categories.values())
            cust_node = {
                "name": cust,
                "value": cust_total,
                "percent": round(cust_total/status_total*100, 1) if status_total else 0,
                "children": []
            }
            
            for cat, rcs in categories.items():
                cat_total = sum(rcs.values())
                cat_node = {
                    "name": cat,
                    "value": cat_total,
                    "percent": round(cat_total/cust_total*100, 1) if cust_total else 0,
                    "children": []
                }
                
                # Limit root causes to top 5
                sorted_rcs = sorted(rcs.items(), key=lambda x: x[1], reverse=True)[:5]
                for rc, count in sorted_rcs:
                    cat_node["children"].append({
                        "name": rc,
                        "value": count,
                        "percent": round(count/cat_total*100, 1) if cat_total else 0
                    })
                
                cust_node["children"].append(cat_node)
            
            status_node["children"].append(cust_node)
        
        # Limit customers to top 10
        status_node["children"] = sorted(status_node["children"], key=lambda x: x["value"], reverse=True)[:10]
        tree["children"].append(status_node)

    response = {"data": tree}
    await cache_set(cache_key, response, ttl=300)
    return response

@router.get("/comparison")
async def get_comparison_data(
    db: AsyncSession = Depends(get_db),
    months: int = Query(6, ge=2, le=12),
):
    cache_key = f"dashboard:comparison:v1:{months}"
    cached = await cache_get(cache_key)
    if cached: return cached

    available_months = await get_available_months(db)
    target_months = available_months[:months]
    target_months.reverse() # Chronological order
    
    if not target_months:
        return {"monthly_data": [], "aggregated": {}}

    # Aggregate query
    stmt = select(
        func.to_char(DashboardData.reporting_day, 'YYYY-MM').label('month'),
        func.count(DashboardData.id).label('total'),
        func.count(case((DashboardData.status == 'LOCK', 1))).label('lock'),
        func.count(case((DashboardData.status == 'HOLD', 1))).label('hold'),
        func.count(case((DashboardData.status == 'FAILURE', 1))).label('failure'),
        func.count(case((DashboardData.current_status == 'CANCELED', 1))).label('canceled')
    ).where(func.to_char(DashboardData.reporting_day, 'YYYY-MM').in_(target_months))
    stmt = stmt.group_by('month').order_by('month')
    
    result = await db.execute(stmt)
    
    monthly_data = []
    for row in result.all():
        total = row.total
        monthly_data.append({
            "month": row.month,
            "label": row.month, # simplified label
            "total": total,
            "lock": row.lock,
            "hold": row.hold,
            "failure": row.failure,
            "canceled": row.canceled,
            "lock_rate": round(row.lock / total * 100, 1) if total else 0,
            "hold_rate": round(row.hold / total * 100, 1) if total else 0,
            "failure_rate": round(row.canceled / total * 100, 1) if total else 0,
        })
    
    # Aggregated logic same as before
    aggregated = None
    if monthly_data:
        total_orders = sum(m["total"] for m in monthly_data)
        total_failure = sum(m["canceled"] for m in monthly_data)
        first = monthly_data[0]
        last = monthly_data[-1]
        
        aggregated = {
            "total_orders": total_orders,
            "overall_failure_rate": round(total_failure / total_orders * 100, 1) if total_orders else 0,
            "avg_monthly_rate": round(sum(m["failure_rate"] for m in monthly_data) / len(monthly_data), 1),
            "trend_change": round(last["failure_rate"] - first["failure_rate"], 1),
            "trend_direction": "stable" # Simplification
        }
        
    response = {
        "monthly_data": monthly_data,
        "aggregated": aggregated or {},
        "customer_trend": [], # Simplified for now, complex query needed
        "category_trend": []
    }
    await cache_set(cache_key, response, ttl=300)
    return response

@router.get("/failure-trend")
async def get_failure_trend(
    db: AsyncSession = Depends(get_db),
    months: int = Query(6, ge=1, le=12),
):
    cache_key = f"dashboard:failure_trend:v1:{months}"
    cached = await cache_get(cache_key)
    if cached: return cached

    available_months = await get_available_months(db)
    target_months = available_months[:months]
    target_months.reverse()
    
    stmt = select(
        func.to_char(DashboardData.reporting_day, 'YYYY-MM').label('month'),
        func.count(DashboardData.id).label('total'),
        func.count(case((DashboardData.current_status == 'CANCELED', 1))).label('canceled')
    ).where(func.to_char(DashboardData.reporting_day, 'YYYY-MM').in_(target_months))
    stmt = stmt.group_by('month').order_by('month')
    
    result = await db.execute(stmt)
    data = []
    for row in result.all():
        data.append({
            "month": row.month,
            "label": row.month,
            "total": row.total,
            "canceled": row.canceled,
            "failure_rate": round(row.canceled / row.total * 100, 1) if row.total else 0
        })
        
    response = {"data": data}
    await cache_set(cache_key, response, ttl=300)
    return response

@router.get("/drilldown")
async def get_drilldown_data(
    db: AsyncSession = Depends(get_db),
    dimension: str = Query(..., description="customer or category"),
    value: str = Query(..., description="The value to filter by"),
    month: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
):
    available_months = await get_available_months(db)
    selected_month = month or (available_months[0] if available_months else None)
    
    query = select(DashboardData)
    if selected_month:
        query = query.where(func.to_char(DashboardData.reporting_day, 'YYYY-MM') == selected_month)
        
    if dimension == 'customer':
        if value == 'Blank': query = query.where(DashboardData.customer.is_(None))
        else: query = query.where(DashboardData.customer == value)
    elif dimension == 'category':
        if value == 'Blank': query = query.where(DashboardData.category.is_(None))
        else: query = query.where(DashboardData.category == value)
    
    # Total count
    count_stmt = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0
    
    # Pagination
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    rows = result.scalars().all()
    
    data = []
    for row in rows:
        data.append({
            "Production Order No.": row.production_no,
            "Customer": row.customer,
            "Category": row.category,
            "Product": row.product,
            "Status": row.status,
            "Current status": row.current_status,
            "Root cause": row.root_cause,
            "Reporting day": row.reporting_day.isoformat() if row.reporting_day else None
        })
        
    return {
        "data": data,
        "total": total,
        "page": page,
        "page_size": page_size,
        "columns": list(data[0].keys()) if data else [],
        "dimension": dimension,
        "value": value
    }
