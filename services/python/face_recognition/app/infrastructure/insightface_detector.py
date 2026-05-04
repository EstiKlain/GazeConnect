# ──────────────────────────────────────────────────────────────
# infrastructure/insightface_detector.py
#
# מטרה: מימוש IFaceDetector עם InsightFace + ArcFace model.
# זה הלב של השירות — הקוד שבאמת "רואה" פנים בתמונה.
#
# איך זה עובד:
#   1. מקבל bytes של תמונה
#   2. ממיר ל-numpy array שOpenCV יכול לעבוד איתו
#   3. InsightFace מוצא פנים ומחשב embedding (512 מספרים)
#   4. מחזיר את ה-embedding + מיקום הפנים
#
# חשוב: המודל נטען פעם אחת בהפעלה (כבד! ~200MB)
# ולא בכל בקשה — זו סיבה ל-Singleton pattern.
# ──────────────────────────────────────────────────────────────

import cv2
import numpy as np
import insightface
from insightface.app import FaceAnalysis
from app.core.interfaces import IFaceDetector
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class InsightFaceDetector(IFaceDetector):
    """
    זיהוי פנים עם InsightFace ArcFace model.
    המודל buffalo_sc = קטן ומהיר, מתאים ל-CPU.
    """

    def __init__(self):
        # טעינת המודל — קורה פעם אחת בהפעלת השירות
        # ctx_id=-1 = CPU mode (אין GPU)
        logger.info("Loading InsightFace model '%s'...", settings.insightface_model)
        self._app = FaceAnalysis(name=settings.insightface_model)
        self._app.prepare(ctx_id=-1)
        logger.info("InsightFace model loaded successfully.")

    async def detect_and_embed(
        self,
        image_bytes: bytes
    ) -> list[tuple[np.ndarray, tuple[int, int, int, int]]]:
        """
        מקבל bytes של תמונה, מחזיר רשימה של (embedding, bounding_box).

        embedding  = np.ndarray בגודל (512,) — ייצוג מספרי של הפנים
        bounding_box = (x, y, width, height) — מיקום בתמונה
        """
        # --- המרת bytes → numpy array שOpenCV מבין ---
        # np.frombuffer: ממיר bytes ל-array של bytes גולמיים
        # cv2.imdecode: מפענח JPEG/PNG ל-BGR image array
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            logger.warning("Failed to decode image bytes")
            return []

        # --- זיהוי פנים ---
        # get() מחזיר רשימת Face objects, כל אחד עם:
        #   face.embedding = np.ndarray(512) — ה-ArcFace embedding
        #   face.bbox = [x1, y1, x2, y2] — פינות הפנים
        faces = self._app.get(img)

        if not faces:
            return []

        results = []
        for face in faces:
            embedding = face.embedding  # np.ndarray(512,)

            # המרת bbox מפורמט InsightFace [x1,y1,x2,y2]
            # לפורמט שלנו (x, y, width, height)
            x1, y1, x2, y2 = face.bbox.astype(int)
            bbox = (x1, y1, x2 - x1, y2 - y1)  # (x, y, width, height)

            results.append((embedding, bbox))

        logger.debug("Detected %d face(s) in image", len(results))
        return results