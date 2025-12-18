import ssl
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

# Create SSL context for DigitalOcean managed PostgreSQL
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

# Remove ssl param from URL if present and pass via connect_args
db_url = settings.DATABASE_URL.replace("?ssl=require", "").replace("&ssl=require", "")
engine = create_async_engine(
    db_url,
    echo=False,
    pool_size=10,
    max_overflow=20,
    connect_args={"ssl": ssl_context} if "ondigitalocean.com" in settings.DATABASE_URL else {}
)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with async_session() as session:
        yield session
