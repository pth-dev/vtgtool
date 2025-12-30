"""
Custom exceptions and global exception handling for VTG Tool API
"""
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)


class VTGToolException(Exception):
    """Base exception for VTG Tool API"""
    def __init__(self, message: str, status_code: int = 500, error_code: str = None):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code or "INTERNAL_ERROR"
        super().__init__(self.message)


class DashboardException(VTGToolException):
    """Exception for dashboard-related errors"""
    def __init__(self, message: str, status_code: int = 500):
        super().__init__(message, status_code, "DASHBOARD_ERROR")


class DataSourceException(VTGToolException):
    """Exception for datasource-related errors"""
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message, status_code, "DATASOURCE_ERROR")


class AuthenticationException(VTGToolException):
    """Exception for authentication errors"""
    def __init__(self, message: str = "Not authenticated"):
        super().__init__(message, 401, "AUTH_ERROR")


class AuthorizationException(VTGToolException):
    """Exception for authorization errors"""
    def __init__(self, message: str = "Not authorized"):
        super().__init__(message, 403, "FORBIDDEN")


class NotFoundException(VTGToolException):
    """Exception for resource not found errors"""
    def __init__(self, resource: str = "Resource"):
        super().__init__(f"{resource} not found", 404, "NOT_FOUND")


class ValidationException(VTGToolException):
    """Exception for validation errors"""
    def __init__(self, message: str):
        super().__init__(message, 422, "VALIDATION_ERROR")


async def vtg_exception_handler(request: Request, exc: VTGToolException) -> JSONResponse:
    """Handler for VTG Tool custom exceptions"""
    logger.error(f"VTG Exception: {exc.error_code} - {exc.message}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.error_code,
            "message": exc.message,
            "detail": exc.message
        }
    )


async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handler for unhandled exceptions"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "INTERNAL_ERROR",
            "message": "An internal error occurred",
            "detail": str(exc) if logger.level <= logging.DEBUG else "Internal server error"
        }
    )
