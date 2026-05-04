# ──────────────────────────────────────────────────────────────
# main.py
#
# מטרה: נקודת הכניסה של השירות — מגדיר את FastAPI app,
# מחבר את כל ה-endpoints, ומנהל את מחזור החיים.
#
# Lifespan (startup/shutdown):
#   startup  → חיבור ל-DB ו-Redis, טעינת מודל InsightFace, יצירת טבלאות
#   shutdown → סגירת חיבורים בצורה מסודרת
#
# Static files:
#   /photos → מגיש את תמונות הפנים ישירות (בלי צורך ב-nginx)
#   Frontend יגש ל: http://localhost:8001/photos/uuid.jpg
# ──────────────────────────────────────────────────────────────

import asyncio
import logging
from contextlib import asynccontextmanager

import asyncpg
import redis.asyncio as aioredis
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.infrastructure.insightface_detector import InsightFaceDetector
from app.infrastructure.postgres_store import PostgresContactStore
from app.infrastructure.redis_cache import RedisEmbeddingCache
from app.api import recognize, enroll, contacts

# הגדרת logging — פורמט שמראה זמן, רמה, ומקור
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    מנהל את מחזור החיים של האפליקציה.
    קוד לפני yield = startup, קוד אחרי yield = shutdown.
    """
    # ── STARTUP ────────────────────────────────────────────────
    logger.info("Starting GazeConnect Face Recognition Service...")

    # 1. חיבור ל-PostgreSQL (pool של 5-20 חיבורים)
    logger.info("Connecting to PostgreSQL...")
    pool = await asyncpg.create_pool(
    dsn=settings.database_url.replace("+asyncpg", ""),
    min_size=5,
    max_size=20,
    ssl=False
)

    # 2. חיבור ל-Redis
    logger.info("Connecting to Redis...")
    redis_client = aioredis.from_url(
        settings.redis_url,
        encoding="utf-8",
        decode_responses=True
    )

    # 3. יצירת infrastructure objects
    contact_store = PostgresContactStore(pool)
    cache = RedisEmbeddingCache(redis_client)

    # 4. יצירת טבלת contacts (אם לא קיימת)
    await contact_store.initialize()

    # 5. טעינת מודל InsightFace (הכבד ביותר — ~200MB, ~30 שניות)
    logger.info("Loading InsightFace model (this may take ~30 seconds)...")
    detector = InsightFaceDetector()

    # 6. שמירת הכל ב-app state (משותף לכל הבקשות)
    app.state.pool = pool
    app.state.redis = redis_client
    app.state.contact_store = contact_store
    app.state.cache = cache
    app.state.detector = detector

    logger.info("✅ Face Recognition Service is ready!")

    yield  # ← כאן השירות רץ ומקבל בקשות

    # ── SHUTDOWN ───────────────────────────────────────────────
    logger.info("Shutting down...")
    await pool.close()
    await redis_client.close()
    logger.info("Connections closed. Goodbye!")


# ── FastAPI App ────────────────────────────────────────────────
app = FastAPI(
    title="GazeConnect Face Recognition Service",
    description="Identifies known contacts in camera frames for AAC button generation",
    version="1.0.0",
    lifespan=lifespan
)

# CORS — מאפשר ל-Angular (localhost:4200) לגשת לשירות
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://localhost:5000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files — מגיש תמונות פנים ישירות
# http://localhost:8001/photos/uuid.jpg → /app/photos/uuid.jpg
app.mount("/photos", StaticFiles(directory=settings.photos_dir), name="photos")

# ── Routers (endpoints) ────────────────────────────────────────
app.include_router(recognize.router, tags=["Recognition"])
app.include_router(enroll.router, tags=["Enrollment"])
app.include_router(contacts.router, tags=["Contacts"])


# ── Health Check ───────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health_check():
    """
    בדיקת תקינות — C# ו-Docker Compose משתמשים בזה.
    מחזיר 200 כשהשירות מוכן.
    """
    return {"status": "healthy", "service": "face-recognition"}