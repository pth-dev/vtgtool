import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from main import app
from app.api.dashboard.service import DashboardService

client = TestClient(app)

@pytest.fixture
def mock_dashboard_service():
    with patch("app.api.dashboard.routes.DashboardService") as MockService:
        service_instance = AsyncMock()
        MockService.return_value = service_instance
        yield service_instance

def test_get_dashboard(mock_dashboard_service):
    # Setup mock return value
    mock_data = {
        "kpis": {"total_orders": 100},
        "charts": {},
        "filters": {}
    }
    mock_dashboard_service.get_dashboard_data.return_value = mock_data

    # Execute request
    response = client.get("/api/dashboard?month=2024-01")

    # Verify
    assert response.status_code == 200
    assert response.json() == mock_data
    mock_dashboard_service.get_dashboard_data.assert_called_once()
    
    # Check arguments passed to service
    call_kwargs = mock_dashboard_service.get_dashboard_data.call_args.kwargs
    assert call_kwargs["month"] == "2024-01"

def test_get_decomposition(mock_dashboard_service):
    mock_data = {"data": {"name": "Total", "children": []}}
    mock_dashboard_service.get_decomposition_data.return_value = mock_data

    response = client.get("/api/dashboard/decomposition?month=2024-01")

    assert response.status_code == 200
    assert response.json() == mock_data
    mock_dashboard_service.get_decomposition_data.assert_called_once_with(month="2024-01")

def test_get_comparison(mock_dashboard_service):
    mock_data = {"monthly_data": []}
    mock_dashboard_service.get_comparison_data.return_value = mock_data

    response = client.get("/api/dashboard/comparison?months=6")

    assert response.status_code == 200
    assert response.json() == mock_data
    mock_dashboard_service.get_comparison_data.assert_called_once_with(months=6)

def test_get_failure_trend(mock_dashboard_service):
    mock_data = {"data": []}
    mock_dashboard_service.get_failure_trend.return_value = mock_data

    response = client.get("/api/dashboard/failure-trend?months=6")

    assert response.status_code == 200
    assert response.json() == mock_data
    mock_dashboard_service.get_failure_trend.assert_called_once_with(months=6)

def test_get_drilldown(mock_dashboard_service):
    mock_data = {"data": [], "total": 0}
    mock_dashboard_service.get_drilldown_data.return_value = mock_data

    response = client.get("/api/dashboard/drilldown?dimension=customer&value=CustA")

    assert response.status_code == 200
    assert response.json() == mock_data
    mock_dashboard_service.get_drilldown_data.assert_called_once()
    call_kwargs = mock_dashboard_service.get_drilldown_data.call_args.kwargs
    assert call_kwargs["dimension"] == "customer"
    assert call_kwargs["value"] == "CustA"
