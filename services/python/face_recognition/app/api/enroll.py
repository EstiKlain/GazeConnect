# ──────────────────────────────────────────────────────────────
# api/enroll.py
#
# מטרה: endpoint POST /enroll
# ה-Admin מוסיף אדם חדש (אמא, מרים הסייעת וכו').
#
# קלט: multipart/form-data עם:
#   name = שם האדם ("אמא", "מרים")
#   file = תמונה עם פנים ברורות
#
# פלט: JSON עם פרטי ההרשמה + photo_url
#
# מה קורה:
#   1. InsightFace מוצא פנים
#   2. חיתוך + שמירת תמונה לדיסק
#   3. שמירת embedding + metadata ל-DB
#   4. ניקוי cache (Redis) כדי שהזיהוי יכיר מיד
# ──────────────────────────────────────────────────────────────

from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from app.core.models import EnrollResponse
from app.services.enrollment_service import EnrollmentService
from app.api.dependencies import get_enrollment_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/enroll",
    response_model=EnrollResponse,
    status_code=201,
    summary="Enroll a new contact",
    description="Register a new person with their name and photo. Returns contact ID and photo URL."
)
async def enroll_contact(
    name: str = Form(..., description="Display name, e.g. 'אמא' or 'מרים הסייעת'"),
    file: UploadFile = File(..., description="Clear photo of the person's face"),
    service: EnrollmentService = Depends(get_enrollment_service)
) -> EnrollResponse:
    """
    מוסיף אדם חדש למערכת הזיהוי.
    ה-Admin Panel קורא לזה כשמוסיפים איש קשר.
    """
    if not name or not name.strip():
        raise HTTPException(status_code=400, detail="Name cannot be empty")

    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image file")

    logger.info("Enrolling new contact: '%s'", name.strip())

    try:
        result = await service.enroll(name=name.strip(), image_bytes=image_bytes)
        return result

    except ValueError as e:
        # שגיאות ידועות: לא נמצאו פנים, יותר מפנים אחד וכו'
        raise HTTPException(status_code=422, detail=str(e))