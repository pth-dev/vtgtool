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
from app.api.auth import get_current_user
from app.models.models import User
from app.schemas.chat import ChatRequest, ChatResponse, ChatHistoryClearResponse
from app.services.gemini_service import get_gemini_service
from app.api.dashboard.service import DashboardService

logger = logging.getLogger(__name__)
router = APIRouter()


async def get_dashboard_context(db: AsyncSession, month: Optional[str] = None) -> dict:
    """Fetch current dashboard data for AI context."""
    try:
        service = DashboardService(db)
        data = await service.get_dashboard_data(month=month)
        
        context = {
            "month": data.get("selected_month", ""),
            "kpis": {},
            "top_customers": [],
            "top_root_causes": []
        }
        
        # Extract KPIs
        if "kpis" in data:
            kpis = data["kpis"]
            context["kpis"] = {
                "total": kpis.get("total_orders", 0),
                "lock": kpis.get("lock_count", 0),
                "lock_rate": kpis.get("lock_rate", 0),
                "hold": kpis.get("hold_count", 0),
                "hold_rate": kpis.get("hold_rate", 0),
                "failed": kpis.get("failed_count", 0),
                "failed_rate": kpis.get("failed_rate", 0),
            }
        
        # Extract top customers
        if "charts" in data and "by_customer" in data["charts"]:
            context["top_customers"] = [
                {"name": c.get("name", ""), "count": c.get("count", 0)}
                for c in data["charts"]["by_customer"][:5]
            ]
        
        # Extract root causes
        if "root_causes" in data:
            context["top_root_causes"] = [
                {
                    "root_cause": rc.get("root_cause", ""),
                    "count": rc.get("count", 0),
                    "percent": rc.get("percent", 0)
                }
                for rc in data["root_causes"][:5]
            ]
        
        return context
    except Exception as e:
        logger.warning(f"Failed to get dashboard context: {e}")
        return {}


@router.post("", response_model=ChatResponse)
async def send_chat_message(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Send a message to AI assistant and get a response.
    Optionally includes current dashboard data for context-aware responses.
    """
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="AI chat is not configured. Please set GEMINI_API_KEY."
        )
    
    try:
        gemini_service = get_gemini_service()
        
        # Generate session ID if not provided
        session_id = request.session_id or f"user_{current_user.id}_{uuid.uuid4().hex[:8]}"
        
        # Get dashboard context if requested
        dashboard_context = None
        if request.include_dashboard_context:
            dashboard_context = await get_dashboard_context(db)
        
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
    current_user: User = Depends(get_current_user)
):
    """Clear chat history for a session."""
    try:
        gemini_service = get_gemini_service()
        
        if session_id:
            gemini_service.clear_history(session_id)
        else:
            # Clear user's default session
            gemini_service.clear_history(f"user_{current_user.id}_default")
        
        return ChatHistoryClearResponse(
            success=True,
            message=f"Chat history cleared for session: {session_id or 'default'}"
        )
    except Exception as e:
        logger.error(f"Failed to clear chat history: {e}")
        raise HTTPException(status_code=500, detail="Failed to clear chat history")
