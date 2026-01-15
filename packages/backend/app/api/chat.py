"""
Chat API Routes
Handles AI chat interactions with Gemini
"""
import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.core.database import get_db
from app.core.config import settings
from app.api.auth import get_current_user_optional
from app.models.models import User
from app.schemas.chat import ChatRequest, ChatResponse, ChatHistoryClearResponse
from app.services.gemini_service import get_gemini_service
from app.api.dashboard.service import DashboardService
from app.api.dashboard.queries import get_available_months

logger = logging.getLogger(__name__)
router = APIRouter()


async def get_dashboard_context(db: AsyncSession, month: Optional[str] = None, compare_months: Optional[list] = None) -> dict:
    """Fetch current dashboard data for AI context - with detailed breakdown."""
    try:
        service = DashboardService(db)
        
        # Get available months first
        available_months = await get_available_months(db)
        
        # Get data for specified month or latest
        data = await service.get_dashboard_data(month=month)
        
        context = {
            "month": data.get("selected_month", ""),
            "available_months": available_months,  # Add available months list
            "kpis": {},
            "top_customers": [],
            "top_root_causes": [],
            "customers_by_status": [],
            "root_causes_by_status": [],
            "comparison_data": []  # For multi-month comparison
        }
        
        # Extract KPIs with full info
        if "kpis" in data:
            kpis = data["kpis"]
            context["kpis"] = {
                "total": kpis.get("total_orders", 0),
                "lock": kpis.get("lock_count", 0),
                "lock_rate": kpis.get("lock_rate", 0),
                "hold": kpis.get("hold_count", 0),
                "hold_rate": kpis.get("hold_rate", 0),
                "failed": kpis.get("failure_count", 0),
                "failed_rate": kpis.get("failure_rate", 0),
                "resume_success_rate": kpis.get("resume_success_rate", 0),
            }
        
        # Extract top customers
        if "charts" in data and "by_customer" in data["charts"]:
            context["top_customers"] = [
                {"name": c.get("name", ""), "count": c.get("count", 0)}
                for c in data["charts"]["by_customer"][:10]
            ]
        
        # Extract root causes
        if "root_causes" in data:
            context["top_root_causes"] = [
                {
                    "root_cause": rc.get("root_cause", ""),
                    "count": rc.get("count", 0),
                    "percent": rc.get("percent", 0)
                }
                for rc in data["root_causes"][:10]
            ]
        
        # Get detailed breakdown data
        detailed_data = await get_detailed_context_data(db, data.get("selected_month"))
        context["customers_by_status"] = detailed_data.get("customers_by_status", [])
        context["root_causes_by_status"] = detailed_data.get("root_causes_by_status", [])
        
        # Get comparison data if multiple months requested
        if compare_months and len(compare_months) > 1:
            comparison_data = await get_comparison_context(db, compare_months)
            context["comparison_data"] = comparison_data
        
        return context
    except Exception as e:
        logger.warning(f"Failed to get dashboard context: {e}")
        return {}


async def get_comparison_context(db: AsyncSession, months: list) -> list:
    """Get comparison data for multiple months."""
    try:
        service = DashboardService(db)
        comparison = []
        
        for m in months:
            data = await service.get_dashboard_data(month=m)
            if "kpis" in data:
                kpis = data["kpis"]
                comparison.append({
                    "month": m,
                    "total_orders": kpis.get("total_orders", 0),
                    "lock_count": kpis.get("lock_count", 0),
                    "lock_rate": kpis.get("lock_rate", 0),
                    "hold_count": kpis.get("hold_count", 0),
                    "hold_rate": kpis.get("hold_rate", 0),
                    "failure_count": kpis.get("failure_count", 0),
                    "failure_rate": kpis.get("failure_rate", 0),
                    "resume_success_rate": kpis.get("resume_success_rate", 0),
                })
        
        return comparison
    except Exception as e:
        logger.warning(f"Failed to get comparison context: {e}")
        return []


async def get_detailed_context_data(db: AsyncSession, month: Optional[str]) -> dict:
    """Get detailed breakdown data for AI context."""
    from sqlalchemy import select, func, desc
    from app.models.models import DashboardData
    
    result = {
        "customers_by_status": [],
        "root_causes_by_status": []
    }
    
    if not month:
        return result
    
    try:
        # Query 1: Customers by status breakdown
        cust_stmt = select(
            DashboardData.customer,
            DashboardData.status,
            func.count(DashboardData.id).label('cnt')
        ).where(
            func.to_char(DashboardData.reporting_day, 'YYYY-MM') == month
        ).group_by(
            DashboardData.customer, DashboardData.status
        ).order_by(desc('cnt'))
        
        cust_result = await db.execute(cust_stmt)
        
        # Aggregate by customer
        cust_map = {}
        for row in cust_result.all():
            cust_name = row.customer or "Blank"
            if cust_name not in cust_map:
                cust_map[cust_name] = {"name": cust_name, "total": 0, "by_status": {}}
            cust_map[cust_name]["total"] += row.cnt
            if row.status:
                cust_map[cust_name]["by_status"][row.status] = row.cnt
        
        result["customers_by_status"] = sorted(
            cust_map.values(), key=lambda x: x["total"], reverse=True
        )[:10]
        
        # Query 2: Root causes by status
        rc_stmt = select(
            DashboardData.root_cause,
            DashboardData.status,
            func.count(DashboardData.id).label('cnt')
        ).where(
            func.to_char(DashboardData.reporting_day, 'YYYY-MM') == month,
            DashboardData.root_cause.is_not(None)
        ).group_by(
            DashboardData.root_cause, DashboardData.status
        ).order_by(desc('cnt')).limit(20)
        
        rc_result = await db.execute(rc_stmt)
        rc_rows = rc_result.all()
        
        total_count = sum(r.cnt for r in rc_rows) if rc_rows else 0
        
        for row in rc_rows:
            result["root_causes_by_status"].append({
                "root_cause": row.root_cause,
                "status": row.status or "Unknown",
                "count": row.cnt,
                "percent": round(row.cnt / total_count * 100, 1) if total_count else 0
            })
        
        return result
    except Exception as e:
        logger.warning(f"Failed to get detailed context data: {e}")
        return result


@router.post("", response_model=ChatResponse)
async def send_chat_message(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional)
):
    """
    Send a message to AI assistant and get a response.
    Optionally includes current dashboard data for context-aware responses.
    Authentication is optional - works for both logged-in and anonymous users.
    """
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="AI chat is not configured. Please set GEMINI_API_KEY."
        )
    
    try:
        gemini_service = get_gemini_service()
        
        # Generate session ID if not provided
        if current_user:
            session_id = request.session_id or f"user_{current_user.id}_{uuid.uuid4().hex[:8]}"
        else:
            # For anonymous users, use session_id or generate a random one
            session_id = request.session_id or f"guest_{uuid.uuid4().hex[:12]}"
        
        # Get dashboard context if requested
        dashboard_context = None
        if request.include_dashboard_context:
            dashboard_context = await get_dashboard_context(
                db, 
                month=request.month,
                compare_months=request.compare_months
            )
        
        # Send message to Gemini
        response_text = await gemini_service.send_message(
            message=request.message,
            session_id=session_id,
            dashboard_context=dashboard_context
        )
        
        return ChatResponse(
            response=response_text,
            session_id=session_id,
            model_used=settings.GEMINI_MODEL_PRIMARY
        )
    
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process chat message")


@router.delete("/history", response_model=ChatHistoryClearResponse)
async def clear_chat_history(
    session_id: Optional[str] = Query(None, description="Session ID to clear. If not provided, clears default session."),
    current_user: User | None = Depends(get_current_user_optional)
):
    """Clear chat history for a session. Works for both logged-in and anonymous users."""
    try:
        gemini_service = get_gemini_service()
        
        if session_id:
            gemini_service.clear_history(session_id)
        else:
            # Clear user's default session or guest session
            if current_user:
                gemini_service.clear_history(f"user_{current_user.id}_default")
            else:
                # For anonymous users, session_id is required
                raise HTTPException(
                    status_code=400,
                    detail="Session ID is required for anonymous users"
                )
        
        return ChatHistoryClearResponse(
            success=True,
            message=f"Chat history cleared for session: {session_id or 'default'}"
        )
    except Exception as e:
        logger.error(f"Failed to clear chat history: {e}")
        raise HTTPException(status_code=500, detail="Failed to clear chat history")
