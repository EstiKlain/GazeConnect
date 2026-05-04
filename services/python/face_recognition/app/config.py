# ──────────────────────────────────────────────────────────────
# config.py
#
# מטרה: קריאת כל הגדרות הסביבה ממשתני סביבה (environment variables).
# Docker מעביר את הערכים האלה דרך docker-compose.yml.
# Pydantic-Settings מאמתת שכל הערכים קיימים ובפורמט הנכון.
# ──────────────────────────────────────────────────────────────

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # --- PostgreSQL ---
    # כתובת ה-DB בתוך Docker network (שם ה-container הוא ה-hostname)
    database_url: str = "postgresql+asyncpg://gazeuser:GazePass2025!@gazeconnect-db:5432/gazeconnect"

    # --- Redis ---
    # כתובת Redis בתוך Docker network
    redis_url: str = "redis://gazeconnect-redis:6379"

    # --- Face Recognition ---
    # סף זיהוי: מעל 0.5 = אדם מוכר, מתחת = לא מוכר
    recognition_threshold: float = 0.5

    # שם המודל של InsightFace (buffalo_sc = קטן ומהיר, מתאים ל-CPU)
    insightface_model: str = "buffalo_sc"

    # --- Photos Storage ---
    # תיקיית שמירת תמונות בתוך ה-container (מחובר ל-Docker volume)
    photos_dir: str = "/app/photos"

    class Config:
        # אם קיים קובץ .env — קרא אותו (שימושי לפיתוח מקומי)
        env_file = ".env"


# instance יחיד שכל הקוד משתמש בו — Singleton pattern
settings = Settings()