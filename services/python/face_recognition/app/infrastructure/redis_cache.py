# ──────────────────────────────────────────────────────────────
# infrastructure/redis_cache.py
#
# מטרה: cache של embeddings ב-Redis לביצועים טובים יותר.
#
# הבעיה בלי cache:
#   כל בקשת /recognize = שאילתה ל-DB = I/O = איטי
#
# הפתרון עם cache:
#   טעינת כל ה-embeddings פעם אחת ל-Redis (TTL: 5 דקות)
#   כל בקשת /recognize = קריאה מ-Redis = מהיר
#   אחרי enroll/delete: cache נמחק → נטען מחדש בבקשה הבאה
#
# פורמט אחסון ב-Redis:
#   key: "face_embeddings"
#   value: JSON array של {id: "uuid", embedding: [0.1, 0.2, ...]}
# ──────────────────────────────────────────────────────────────

import redis.asyncio as aioredis
import numpy as np
import json
from uuid import UUID
from typing import Optional
import logging

from app.core.interfaces import IEmbeddingCache
from app.config import settings

logger = logging.getLogger(__name__)

# כמה זמן ה-cache תקף (שניות)
CACHE_TTL_SECONDS = 300  # 5 דקות
CACHE_KEY = "face_embeddings"


class RedisEmbeddingCache(IEmbeddingCache):
    """
    Cache של embeddings ב-Redis.
    מאיץ את חיפוש הדמיון בלי לטעון מה-DB בכל בקשה.
    """

    def __init__(self, redis_client: aioredis.Redis):
        self._redis = redis_client

    async def get_all_embeddings(self) -> Optional[list[tuple[UUID, np.ndarray]]]:
        """
        מחזיר embeddings מה-cache.
        None = cache ריק (צריך לטעון מה-DB).
        """
        try:
            data = await self._redis.get(CACHE_KEY)
            if data is None:
                return None  # cache miss

            # פענוח JSON → רשימת (UUID, numpy array)
            items = json.loads(data)
            result = []
            for item in items:
                contact_id = UUID(item["id"])
                embedding = np.array(item["embedding"], dtype=np.float32)
                result.append((contact_id, embedding))

            logger.debug("Cache hit: loaded %d embeddings from Redis", len(result))
            return result

        except Exception as e:
            # אם Redis לא זמין — ממשיך בלי cache (degraded mode)
            logger.warning("Redis cache read failed: %s", e)
            return None

    async def set_all_embeddings(
        self,
        embeddings: list[tuple[UUID, np.ndarray]]
    ) -> None:
        """
        שומר embeddings ב-cache עם TTL של 5 דקות.
        """
        try:
            # המרה ל-JSON-serializable format
            items = [
                {
                    "id": str(contact_id),
                    "embedding": embedding.tolist()  # numpy → list רגיל
                }
                for contact_id, embedding in embeddings
            ]

            await self._redis.setex(
                CACHE_KEY,
                CACHE_TTL_SECONDS,
                json.dumps(items)
            )

            logger.debug("Cached %d embeddings in Redis (TTL=%ds)", len(items), CACHE_TTL_SECONDS)

        except Exception as e:
            logger.warning("Redis cache write failed: %s", e)

    async def invalidate(self) -> None:
        """
        מנקה את ה-cache — נקרא אחרי enroll או delete.
        הבקשה הבאה תטעון מחדש מה-DB.
        """
        try:
            await self._redis.delete(CACHE_KEY)
            logger.debug("Embedding cache invalidated")
        except Exception as e:
            logger.warning("Redis cache invalidate failed: %s", e)