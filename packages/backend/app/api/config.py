from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Any

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.models import AppConfig, User

router = APIRouter(prefix="/config", tags=["config"])

class ConfigUpdate(BaseModel):
    value: Any

@router.get("/{key}")
async def get_config(key: str, db: AsyncSession = Depends(get_db)):
    """Get config by key (public)"""
    result = await db.execute(select(AppConfig).where(AppConfig.key == key))
    config = result.scalar_one_or_none()
    if not config:
        return {"key": key, "value": None}
    return {"key": config.key, "value": config.value}

@router.put("/{key}")
async def update_config(
    key: str,
    data: ConfigUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update config (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    result = await db.execute(select(AppConfig).where(AppConfig.key == key))
    config = result.scalar_one_or_none()
    
    if config:
        config.value = data.value
        config.updated_by = current_user.id
    else:
        config = AppConfig(key=key, value=data.value, updated_by=current_user.id)
        db.add(config)
    
    await db.commit()
    return {"key": key, "value": data.value}
