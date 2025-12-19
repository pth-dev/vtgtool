import json
import redis.asyncio as redis
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

_redis: redis.Redis | None = None

async def get_redis() -> redis.Redis:
    global _redis
    if _redis is None:
        _redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
        logger.info("Redis connection established")
    return _redis

async def cache_get(key: str):
    try:
        r = await get_redis()
        data = await r.get(key)
        return json.loads(data) if data else None
    except redis.RedisError as e:
        logger.warning(f"Redis cache get failed for key '{key}': {e}")
        return None
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error for cache key '{key}': {e}")
        return None

async def cache_set(key: str, value, ttl: int = 300):
    try:
        r = await get_redis()
        await r.setex(key, ttl, json.dumps(value, default=str))
    except redis.RedisError as e:
        logger.warning(f"Redis cache set failed for key '{key}': {e}")
    except (TypeError, ValueError) as e:
        logger.error(f"JSON serialization error for cache key '{key}': {e}")

async def cache_delete(pattern: str):
    try:
        r = await get_redis()
        keys = await r.keys(pattern)
        if keys:
            await r.delete(*keys)
            logger.debug(f"Deleted {len(keys)} cache keys matching pattern '{pattern}'")
    except redis.RedisError as e:
        logger.warning(f"Redis cache delete failed for pattern '{pattern}': {e}")

