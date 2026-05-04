# ──────────────────────────────────────────────────────────────
# services/enrollment_service.py
#
# מטרה: לוגיקת הרשמת אדם חדש למערכת ("enroll").
#
# זרימת הרשמה:
#   1. מקבל תמונה + שם מה-Admin
#   2. InsightFace מוצא פנים בתמונה + מחשב embedding
#   3. חיתוך הפנים ושמירת תמונה קטנה לדיסק
#   4. שמירת (שם, embedding, photo_url) ב-DB
#   5. מחיקת cache כדי שהזיהוי יכיר את האדם החדש מיד
#
# מה נשמר:
#   /app/photos/{uuid}.jpg  ← תמונת הפנים (Docker volume)
#   contacts טבלה ← embedding + metadata
# ──────────────────────────────────────────────────────────────

import cv2
import numpy as np
import os
from uuid import uuid4
import logging

from app.core.interfaces import IFaceDetector, IContactStore, IEmbeddingCache
from app.core.models import Contact, EnrollResponse
from app.config import settings

logger = logging.getLogger(__name__)


class EnrollmentService:
    """
    רישום אנשי קשר חדשים למערכת.
    """

    def __init__(
        self,
        detector: IFaceDetector,
        store: IContactStore,
        cache: IEmbeddingCache
    ):
        self._detector = detector
        self._store = store
        self._cache = cache

        # וידוא שתיקיית התמונות קיימת
        os.makedirs(settings.photos_dir, exist_ok=True)

    async def enroll(self, name: str, image_bytes: bytes) -> EnrollResponse:
        """
        רושם אדם חדש מתמונה.
        מחזיר פרטי ההרשמה כולל ה-photo_url.
        """
        # שלב 1: זיהוי פנים בתמונה
        detected = await self._detector.detect_and_embed(image_bytes)

        if not detected:
            raise ValueError("No face detected in the provided image")

        if len(detected) > 1:
            raise ValueError(
                f"Multiple faces detected ({len(detected)}). "
                "Please provide an image with exactly one person."
            )

        embedding, bbox = detected[0]

        # שלב 2: שמירת תמונת הפנים
        photo_url = await self._save_face_photo(image_bytes, bbox)

        # שלב 3: שמירה ב-DB
        contact = await self._store.save_contact(
            name=name,
            embedding=embedding,
            photo_url=photo_url
        )

        # שלב 4: מחיקת cache — כדי שהאדם החדש יזוהה מיד
        await self._cache.invalidate()

        logger.info("Enrolled '%s' successfully (id=%s)", name, contact.id)

        return EnrollResponse(
            contact_id=contact.id,
            name=contact.name,
            photo_url=photo_url,
            message=f"'{name}' enrolled successfully"
        )

    async def _save_face_photo(
        self,
        image_bytes: bytes,
        bbox: tuple[int, int, int, int]
    ) -> str:
        """
        חותך את הפנים מהתמונה ושומר כקובץ JPEG.
        מחזיר את ה-URL היחסי: "/photos/uuid.jpg"

        למה לחתוך? כי אנחנו שומרים רק את הפנים (לא כל התמונה):
        - גודל קטן יותר
        - פרטיות טובה יותר
        - תצוגה טובה יותר על כפתור AAC
        """
        # פענוח התמונה
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        x, y, w, h = bbox

        # הוספת padding של 20% סביב הפנים לתמונה נעימה יותר
        padding_x = int(w * 0.2)
        padding_y = int(h * 0.2)

        # וידוא שלא יוצאים מגבולות התמונה
        img_h, img_w = img.shape[:2]
        x1 = max(0, x - padding_x)
        y1 = max(0, y - padding_y)
        x2 = min(img_w, x + w + padding_x)
        y2 = min(img_h, y + h + padding_y)

        # חיתוך הפנים
        face_crop = img[y1:y2, x1:x2]

        # שמירה כ-JPEG
        photo_filename = f"{uuid4()}.jpg"
        photo_path = os.path.join(settings.photos_dir, photo_filename)
        cv2.imwrite(photo_path, face_crop, [cv2.IMWRITE_JPEG_QUALITY, 90])

        logger.debug("Saved face photo: %s", photo_path)

        # מחזיר URL יחסי — ה-Frontend יבנה: http://localhost:8001/photos/uuid.jpg
        return f"/photos/{photo_filename}"