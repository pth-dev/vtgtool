from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, datasources, dashboard, config, isc
from app.core.config import settings
from app.core.logging_config import setup_logging
import logging

# Setup logging
setup_logging(settings.ENVIRONMENT)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="VTGTOOL API",
    description="Internal Data Analytics Platform for Garment Industry",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

logger.info(f"Starting VTGTOOL API in {settings.ENVIRONMENT} mode")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:80", "https://vtgtool.help", "http://vtgtool.help"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router, prefix="/api/dashboard", tags=["📊 Dashboard"])
app.include_router(auth.router, prefix="/api/auth", tags=["🔐 Authentication"])
app.include_router(datasources.router, prefix="/api/datasources", tags=["📁 Data Sources"])
app.include_router(config.router, prefix="/api", tags=["⚙️ Config"])
app.include_router(isc.router, prefix="/api/isc", tags=["🔍 ISC DO System"])

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
