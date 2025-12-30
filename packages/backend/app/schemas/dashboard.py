"""
Dashboard response schemas - Pydantic models for Dashboard API responses
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Any


# ============ KPI Models ============

class TopItemResponse(BaseModel):
    """Top category/customer item"""
    name: str
    percent: float


class KPIResponse(BaseModel):
    """Dashboard KPI metrics"""
    total_orders: int = Field(description="Total number of orders")
    lock_count: int = Field(description="Number of LOCK orders")
    hold_count: int = Field(description="Number of HOLD orders")
    failure_count: int = Field(description="Number of FAILURE orders")
    resume_success_rate: float = Field(description="Resume success rate percentage")
    hold_rate: float = Field(description="Hold rate percentage")
    failure_rate: float = Field(description="Failure rate percentage")
    top_category: Optional[TopItemResponse] = None
    top_customer: Optional[TopItemResponse] = None


class MoMChangeResponse(BaseModel):
    """Month-over-month change metrics"""
    total_orders: Optional[float] = None
    lock_count: Optional[float] = None
    hold_count: Optional[float] = None
    failure_count: Optional[float] = None
    resume_success_rate: Optional[float] = None
    hold_rate: Optional[float] = None
    failure_rate: Optional[float] = None


# ============ Chart Models ============

class ChartItemResponse(BaseModel):
    """Single chart data item"""
    name: str
    count: int
    percent: float


class TrendDataResponse(BaseModel):
    """Trend chart data point"""
    date: str
    LOCK: Optional[int] = None
    HOLD: Optional[int] = None
    FAILURE: Optional[int] = None


class ChartsResponse(BaseModel):
    """All charts data"""
    by_customer: List[ChartItemResponse]
    by_category: List[ChartItemResponse]
    by_status: List[ChartItemResponse]
    trend: List[dict]  # Dynamic keys based on status


# ============ Root Cause Models ============

class RootCauseResponse(BaseModel):
    """Root cause data"""
    root_cause: str
    count: int
    improvement_plan: Optional[str] = None
    percent: float


# ============ Filter Models ============

class FilterOptionsResponse(BaseModel):
    """Available filter options"""
    months: List[str]
    customers: List[str]
    categories: List[str]
    statuses: List[str]
    products: List[str]


# ============ Main Dashboard Response ============

class DashboardResponse(BaseModel):
    """Complete dashboard response"""
    kpis: KPIResponse
    prev_month_kpis: Optional[dict] = None
    mom_change: Optional[MoMChangeResponse] = None
    charts: ChartsResponse
    root_causes: List[RootCauseResponse]
    filters: FilterOptionsResponse
    selected_month: Optional[str] = None
    prev_month: Optional[str] = None


class DashboardErrorResponse(BaseModel):
    """Dashboard error response"""
    kpis: dict = Field(default_factory=dict)
    charts: dict = Field(default_factory=dict)
    filters: dict = Field(default_factory=dict)
    error: str


# ============ Decomposition Models ============

class TreeNodeResponse(BaseModel):
    """Decomposition tree node"""
    name: str
    value: int
    percent: Optional[float] = None
    children: Optional[List["TreeNodeResponse"]] = None


class DecompositionResponse(BaseModel):
    """Decomposition tree response"""
    data: TreeNodeResponse


# ============ Comparison Models ============

class MonthlyDataResponse(BaseModel):
    """Monthly comparison data"""
    month: str
    label: str
    total: int
    lock: int
    hold: int
    failure: int
    canceled: int
    lock_rate: float
    hold_rate: float
    failure_rate: float


class AggregatedResponse(BaseModel):
    """Aggregated comparison data"""
    total_orders: int
    overall_failure_rate: float
    avg_monthly_rate: float
    trend_change: float
    trend_direction: str = "stable"


class ComparisonResponse(BaseModel):
    """Monthly comparison response"""
    monthly_data: List[MonthlyDataResponse]
    aggregated: Optional[AggregatedResponse] = None
    customer_trend: List[Any] = Field(default_factory=list)
    category_trend: List[Any] = Field(default_factory=list)


# ============ Failure Trend Models ============

class FailureTrendItemResponse(BaseModel):
    """Failure trend data point"""
    month: str
    label: str
    total: int
    canceled: int
    failure_rate: float


class FailureTrendResponse(BaseModel):
    """Failure trend response"""
    data: List[FailureTrendItemResponse]


# ============ Drilldown Models ============

class DrilldownResponse(BaseModel):
    """Drilldown data response"""
    data: List[dict]
    total: int
    page: int
    page_size: int
    columns: List[str]
    dimension: str
    value: str


# Required for self-referencing model
TreeNodeResponse.model_rebuild()
