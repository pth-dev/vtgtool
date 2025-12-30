"""
Dashboard Service
Handles business logic for dashboard data retrieval and processing
"""
import asyncio
from typing import Optional, Dict, List, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, case
from app.models.models import DashboardData
from app.api.dashboard.queries import (
    apply_filters,
    get_available_months,
    calculate_metrics,
    get_top_item,
    get_chart_data,
)
from app.api.dashboard.helpers import clean_for_json, calc_mom_change

class DashboardService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_dashboard_data(
        self,
        month: Optional[str] = None,
        customers: Optional[str] = None,
        categories: Optional[str] = None,
        statuses: Optional[str] = None,
        products: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get main dashboard data with KPIs, charts, and filters"""
        available_months = await get_available_months(self.db)
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
        prev_filters = {**current_filters, "month": prev_month}

        # === CONCURRENT EXECUTION: KPIs, Charts, Top Items ===
        async def empty_dict():
            return {}
        
        # Prepare all concurrent tasks
        tasks = {
            "kpis": calculate_metrics(self.db, current_filters),
            "prev_kpis": calculate_metrics(self.db, prev_filters) if prev_month else empty_dict(),
            "by_customer": get_chart_data(self.db, DashboardData.customer, current_filters),
            "by_category": get_chart_data(self.db, DashboardData.category, current_filters),
            "by_status": get_chart_data(self.db, DashboardData.status, current_filters),
            "top_category": get_top_item(self.db, DashboardData.category, current_filters),
            "top_customer": get_top_item(self.db, DashboardData.customer, current_filters),
        }
        
        # Execute all queries concurrently
        results = await asyncio.gather(*tasks.values(), return_exceptions=True)
        data = dict(zip(tasks.keys(), results))
        
        # Handle any exceptions
        for key, value in data.items():
            if isinstance(value, Exception):
                data[key] = {} if key in ["kpis", "prev_kpis"] else []
        
        kpis = data["kpis"]
        prev_kpis = data["prev_kpis"]
        kpis["top_category"] = data["top_category"]
        kpis["top_customer"] = data["top_customer"]
        
        mom_change = calc_mom_change(kpis, prev_kpis)

        charts = {
            "by_customer": data["by_customer"],
            "by_category": data["by_category"],
            "by_status": data["by_status"],
        }

        # Trend Chart (still sequential as it modifies charts dict)
        trend_stmt = select(
            func.to_char(DashboardData.reporting_day, 'YYYY-MM-DD').label('day'),
            DashboardData.status,
            func.count(DashboardData.id)
        )
        trend_stmt = apply_filters(trend_stmt, **current_filters)
        trend_stmt = trend_stmt.group_by('day', DashboardData.status).order_by('day')
        trend_res = await self.db.execute(trend_stmt)
        
        trend_data = {}
        for day, status, count in trend_res.all():
            if day not in trend_data: trend_data[day] = {"date": day}
            trend_data[day][status] = count
        charts["trend"] = list(trend_data.values())

        # Root Causes
        rc_stmt = select(
            DashboardData.root_cause, 
            func.count(DashboardData.id).label('cnt'),
            func.max(DashboardData.improvement_plan).label('imp_plan')
        )
        rc_stmt = apply_filters(rc_stmt, **current_filters)
        rc_stmt = rc_stmt.where(DashboardData.root_cause.is_not(None))
        rc_stmt = rc_stmt.group_by(DashboardData.root_cause).order_by(desc('cnt')).limit(20)
        rc_res = await self.db.execute(rc_stmt)
        
        total_rows = kpis.get("total_orders", 0)
        root_causes = [
            {
                "root_cause": r.root_cause,
                "count": int(r.cnt),
                "improvement_plan": r.imp_plan,
                "percent": round(r.cnt / total_rows * 100, 1) if total_rows else 0
            } for r in rc_res.all()
        ]

        # === CONCURRENT EXECUTION: Filter Options ===
        async def get_distinct_vals(col):
            q = select(col).distinct().order_by(col)
            if selected_month:
                q = q.where(func.to_char(DashboardData.reporting_day, 'YYYY-MM') == selected_month)
            res = await self.db.execute(q)
            return [str(r) for r in res.scalars().all() if r is not None]

        # Run all filter queries concurrently
        filter_results = await asyncio.gather(
            get_distinct_vals(DashboardData.customer),
            get_distinct_vals(DashboardData.category),
            get_distinct_vals(DashboardData.status),
            get_distinct_vals(DashboardData.product),
        )
        
        filter_options = {
            "months": available_months,
            "customers": filter_results[0],
            "categories": filter_results[1],
            "statuses": filter_results[2],
            "products": filter_results[3],
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
        
        return clean_for_json(response)

    async def get_decomposition_data(self, month: Optional[str] = None) -> Dict[str, Any]:
        """Get hierarchical decomposition tree data"""
        available_months = await get_available_months(self.db)
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
        result = await self.db.execute(stmt)
        rows = result.all()
        
        total = sum(r.cnt for r in rows)
        tree = {"name": "Total", "value": total, "children": []}
        
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
                    
                    sorted_rcs = sorted(rcs.items(), key=lambda x: x[1], reverse=True)[:5]
                    for rc, count in sorted_rcs:
                        cat_node["children"].append({
                            "name": rc,
                            "value": count,
                            "percent": round(count/cat_total*100, 1) if cat_total else 0
                        })
                    
                    cust_node["children"].append(cat_node)
                
                status_node["children"].append(cust_node)
            
            status_node["children"] = sorted(status_node["children"], key=lambda x: x["value"], reverse=True)[:10]
            tree["children"].append(status_node)

        return {"data": tree}

    async def get_comparison_data(self, months: int = 6) -> Dict[str, Any]:
        """Get monthly comparison data"""
        available_months = await get_available_months(self.db)
        target_months = available_months[:months]
        target_months.reverse()
        
        if not target_months:
            return {"monthly_data": [], "aggregated": {}}

        stmt = select(
            func.to_char(DashboardData.reporting_day, 'YYYY-MM').label('month'),
            func.count(DashboardData.id).label('total'),
            func.count(case((DashboardData.status == 'LOCK', 1))).label('lock'),
            func.count(case((DashboardData.status == 'HOLD', 1))).label('hold'),
            func.count(case((DashboardData.status == 'FAILURE', 1))).label('failure'),
            func.count(case((DashboardData.current_status == 'CANCELED', 1))).label('canceled')
        ).where(func.to_char(DashboardData.reporting_day, 'YYYY-MM').in_(target_months))
        stmt = stmt.group_by('month').order_by('month')
        
        result = await self.db.execute(stmt)
        
        monthly_data = []
        for row in result.all():
            total = row.total
            monthly_data.append({
                "month": row.month,
                "label": row.month,
                "total": total,
                "lock": row.lock,
                "hold": row.hold,
                "failure": row.failure,
                "canceled": row.canceled,
                "lock_rate": round(row.lock / total * 100, 1) if total else 0,
                "hold_rate": round(row.hold / total * 100, 1) if total else 0,
                "failure_rate": round(row.canceled / total * 100, 1) if total else 0,
            })
        
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
                "trend_direction": "stable"
            }
            
        return {
            "monthly_data": monthly_data,
            "aggregated": aggregated or {},
            "customer_trend": [],
            "category_trend": []
        }

    async def get_failure_trend(self, months: int = 6) -> Dict[str, Any]:
        """Get failure trend data"""
        available_months = await get_available_months(self.db)
        target_months = available_months[:months]
        target_months.reverse()
        
        stmt = select(
            func.to_char(DashboardData.reporting_day, 'YYYY-MM').label('month'),
            func.count(DashboardData.id).label('total'),
            func.count(case((DashboardData.current_status == 'CANCELED', 1))).label('canceled')
        ).where(func.to_char(DashboardData.reporting_day, 'YYYY-MM').in_(target_months))
        stmt = stmt.group_by('month').order_by('month')
        
        result = await self.db.execute(stmt)
        data = []
        for row in result.all():
            data.append({
                "month": row.month,
                "label": row.month,
                "total": row.total,
                "canceled": row.canceled,
                "failure_rate": round(row.canceled / row.total * 100, 1) if row.total else 0
            })
            
        return {"data": data}

    async def get_drilldown_data(
        self,
        dimension: str,
        value: str,
        month: Optional[str] = None,
        page: int = 1,
        page_size: int = 50
    ) -> Dict[str, Any]:
        """Get drilldown data for specific dimension"""
        available_months = await get_available_months(self.db)
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
        
        count_stmt = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_stmt)).scalar() or 0
        
        query = query.offset((page - 1) * page_size).limit(page_size)
        result = await self.db.execute(query)
        rows = result.scalars().all()
        
        data = []
        for row in rows:
            data.append({
                "Production Order No.": row.production_order_no,
                "Customer": row.customer,
                "Category": row.category,
                "Product": row.product,
                "Status": row.status,
                "Current status": row.current_status,
                "Root cause": row.root_cause,
                "Reporting day": row.reporting_day.isoformat() if row.reporting_day else None,
                "Production No": row.production_no
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
