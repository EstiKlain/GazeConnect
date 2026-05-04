# ──────────────────────────────────────────────────────────────
# api/dependencies.py
#
# מטרה: Dependency Injection — FastAPI מזריק את האובייקטים
# הנכונים לכל endpoint אוטומטית.
#
# איך זה עובד:
#   כל endpoint מצהיר על מה הוא צריך ב-Depends(...)
#   FastAPI קורא לפונקציה המתאימה וממיר את התוצאה
#
# למה לא ליצור ישירות ב-endpoint?
#   כי אז כל בקשה תיצור חיבורים חדשים ל-DB/Redis — בזבוז!
#   ה-pool נוצר פעם אחת ב-startup ומשותף לכל הבקשות.
# ──────────────────────────────────────────────────────────────

from fastapi import Request
from app.infrastructure.postgres_store import PostgresContactStore
from app.infrastructure.redis_cache import RedisEmbeddingCache
from app.infrastructure.insightface_detector import InsightFaceDetector
from app.services.recognition_service import RecognitionService
from app.services.enrollment_service import EnrollmentService


def get_contact_store(request: Request) -> PostgresContactStore:
    """
    מחזיר את ה-PostgresContactStore מה-app state.
    נוצר פעם אחת ב-startup ומשותף לכל הבקשות.
    """
    return request.app.state.contact_store


def get_cache(request: Request) -> RedisEmbeddingCache:
    """
    מחזיר את ה-RedisEmbeddingCache מה-app state.
    """
    return request.app.state.cache


def get_detector(request: Request) -> InsightFaceDetector:
    """
    מחזיר את ה-InsightFaceDetector מה-app state.
    המודל נטען פעם אחת ב-startup (כבד! ~200MB).
    """
    return request.app.state.detector


def get_recognition_service(request: Request) -> RecognitionService:
    """
    בונה RecognitionService מה-components ב-app state.
    FastAPI יצור instance חדש לכל בקשה — אבל ה-components עצמם
    (detector, store, cache) משותפים.
    """
    return RecognitionService(
        detector=request.app.state.detector,
        store=request.app.state.contact_store,
        cache=request.app.state.cache
    )


def get_enrollment_service(request: Request) -> EnrollmentService:
    """
    בונה EnrollmentService מה-components ב-app state.
    """
    return EnrollmentService(
        detector=request.app.state.detector,
        store=request.app.state.contact_store,
        cache=request.app.state.cache
    )