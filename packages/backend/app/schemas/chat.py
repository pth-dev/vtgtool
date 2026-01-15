"""
Chat API Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ChatRequest(BaseModel):
    """Request schema for sending a chat message."""
    message: str = Field(..., min_length=1, max_length=4000, description="User message")
    include_dashboard_context: bool = Field(
        default=True,
        description="Include current dashboard data in AI context"
    )
    month: Optional[str] = Field(
        default=None,
        description="Month to analyze in YYYY-MM format (e.g., '2025-09'). If not provided, uses latest month."
    )
    compare_months: Optional[List[str]] = Field(
        default=None,
        description="List of months to compare (e.g., ['2025-09', '2025-10', '2025-11'])"
    )
    session_id: Optional[str] = Field(
        default=None,
        max_length=100,
        description="Session ID for conversation continuity"
    )


class ChatResponse(BaseModel):
    """Response schema for chat message."""
    response: str = Field(..., description="AI response")
    session_id: str = Field(..., description="Session ID used")
    model_used: str = Field(..., description="Gemini model that generated the response")
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ChatHistoryClearResponse(BaseModel):
    """Response schema for clearing chat history."""
    success: bool = True
    message: str = "Chat history cleared"
