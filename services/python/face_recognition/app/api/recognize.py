# ──────────────────────────────────────────────────────────────
# api/recognize.py
#
# מטרה: endpoint POST /recognize
# זה מה ש-C# קורא בכל frame שהמצלמה לוכדת.
#
# קלט:  multipart/form-data עם:
#   file         = bytes של תמונה (JPEG)
#   timestamp_ms = מתי הframe נלכד (לא בשימוש כאן, C# מחשב לבד)
#
# פלט: JSON array של FaceDetectionResponse
#   [{ personId, personName, confidence, boundingBox, isKnown }, ...]
#
# הערה: C# שולח את זה כ-multipart (ראה HttpFaceRecognitionClient.cs)
# ──────────────────────────────────────────────────────────────

from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from app.core.models import FaceDetectionResponse
from app.services.recognition_service import RecognitionService
from app.api.dependencies import get_recognition_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/recognize",
    response_model=list[FaceDetectionResponse],
    summary="Recognize faces in a camera frame",
    description="Receives a JPEG frame and returns all detected faces with recognition results."
)
async def recognize_faces(
    file: UploadFile = File(..., description="JPEG image from camera"),
    timestamp_ms: str = Form(..., description="Frame capture timestamp (Unix ms)"),
    service: RecognitionService = Depends(get_recognition_service)
) -> list[FaceDetectionResponse]:
    """
    מקבל frame מהמצלמה → מזהה פנים → מחזיר מי בתמונה.

    C# קורא לזה דרך HttpFaceRecognitionClient.RecognizeAsync()
    """
    # קריאת bytes של התמונה
    image_bytes = await file.read()

    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image file")

    logger.debug("Processing frame, timestamp_ms=%s, size=%d bytes", timestamp_ms, len(image_bytes))

    # הזיהוי עצמו — הלוגיקה ב-RecognitionService
    results = await service.recognize(image_bytes)

    logger.debug("Recognition complete: %d face(s) found", len(results))
    return results