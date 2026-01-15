from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.api import auth, config, isc, chat
from app.api.dashboard import router as dashboard_router
from app.api.datasources import router as datasources_router
from app.core.config import settings
from app.core.logging_config import setup_logging
from app.core.exceptions import VTGToolException, vtg_exception_handler, global_exception_handler
import logging

# Setup logging
setup_logging(settings.ENVIRONMENT)
logger = logging.getLogger(__name__)

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="VTGTOOL API",
    description="Internal Data Analytics Platform for Garment Industry",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Add rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add global exception handlers
app.add_exception_handler(VTGToolException, vtg_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

logger.info(f"Starting VTGTOOL API in {settings.ENVIRONMENT} mode")

# Configure CORS based on environment
if settings.ENVIRONMENT == "production":
    allowed_origins = [
        "https://vtgtool.help",
        "http://vtgtool.help",
    ]
else:
    # Development mode - allow local origins
    allowed_origins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:80",
    ]

from starlette.middleware.base import BaseHTTPMiddleware

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Content-Security-Policy"] = "frame-ancestors 'none'"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        return response

app.add_middleware(SecurityHeadersMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["Content-Type", "Authorization", "Cookie"],
    max_age=3600,
)

app.include_router(dashboard_router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(datasources_router, prefix="/api/datasources", tags=["Data Sources"])
app.include_router(config.router, prefix="/api")
app.include_router(isc.router, prefix="/api/isc", tags=["ISC DO System"])
app.include_router(chat.router, prefix="/api/chat", tags=["AI Chat"])

@app.get("/health", tags=["System"])
async def health():
    """
    Health check endpoint with detailed status
    Returns system status including database and cache connectivity
    """
    from app.core.database import engine
    from app.core.cache import get_redis
    
    status = {
        "status": "ok",
        "environment": settings.ENVIRONMENT,
        "database": "unknown",
        "cache": "unknown"
    }
    
    # Check database connection
    try:
        from sqlalchemy import text
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        status["database"] = "connected"
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        status["database"] = "disconnected"
        status["status"] = "degraded"
    
    # Check Redis connection
    try:
        r = await get_redis()
        await r.ping()
        status["cache"] = "connected"
    except Exception as e:
        logger.warning(f"Redis health check failed: {e}")
        status["cache"] = "disconnected"
    
    return status
