from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, datasources, dashboard, config, isc

app = FastAPI(
    title="VTGTOOL API",
    description="Internal Data Analytics Platform for Garment Industry",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

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
    return {"status": "ok"}
