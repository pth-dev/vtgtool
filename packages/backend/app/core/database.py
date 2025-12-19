import ssl
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Create SSL context for managed PostgreSQL
def get_ssl_context():
    """Create SSL context based on environment"""
    ssl_context = ssl.create_default_context()
    
    if settings.ENVIRONMENT == "development":
        # Disable SSL verification in development
        logger.warning("SSL certificate verification disabled for development")
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
    elif "ondigitalocean.com" in settings.DATABASE_URL:
        # DigitalOcean managed database - accept self-signed certs
        logger.info("Using SSL with DigitalOcean managed database")
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
    
    return ssl_context

# Remove ssl param from URL if present and pass via connect_args
db_url = settings.DATABASE_URL.replace("?ssl=require", "").replace("&ssl=require", "")

# Determine if we need SSL (only for managed databases like DigitalOcean)
needs_ssl = "ondigitalocean.com" in settings.DATABASE_URL

engine = create_async_engine(
    db_url,
    echo=settings.ENVIRONMENT == "development",
    pool_size=10,
    max_overflow=20,
    connect_args={"ssl": get_ssl_context()} if needs_ssl else {}
)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with async_session() as session:
        yield session
