# ──────────────────────────────────────────────────────────────
# services/recognition_service.py
#
# מטרה: לוגיקת הזיהוי המרכזית — מחבר בין InsightFace, DB, ו-Cache.
#
# זרימת זיהוי לכל בקשה:
#   1. InsightFace → מוצא פנים בתמונה + מחשב embeddings
#   2. Redis cache → האם יש embeddings שמורים?
#      - כן: חישוב cosine similarity מול cache
#      - לא: טעינה מה-DB → שמירה ב-cache → חישוב
#   3. השוואה: כל פנים מול כל איש קשר → מי הכי דומה?
#   4. מחזיר תוצאות בפורמט שC# מצפה לקבל
# ──────────────────────────────────────────────────────────────

import numpy as np
import logging
from uuid import UUID

from app.core.interfaces import IFaceDetector, IContactStore, IEmbeddingCache
from app.core.models import FaceDetectionResponse, BoundingBox
from app.config import settings

logger = logging.getLogger(__name__)


class RecognitionService:
    """
    לוגיקת זיהוי פנים: מתמונה גולמית → תוצאות מי נמצא בתמונה.
    """

    def __init__(
        self,
        detector: IFaceDetector,
        store: IContactStore,
        cache: IEmbeddingCache
    ):
        # Dependency Injection — מקבל את כל התלויות מבחוץ
        # זה מאפשר להחליף כל חלק בנפרד (למשל ב-tests: MockDetector)
        self._detector = detector
        self._store = store
        self._cache = cache

    async def recognize(self, image_bytes: bytes) -> list[FaceDetectionResponse]:
        """
        הפונקציה הראשית — מקבל תמונה, מחזיר מי נמצא בה.
        """
        # שלב 1: זיהוי פנים בתמונה
        detected_faces = await self._detector.detect_and_embed(image_bytes)

        if not detected_faces:
            return []  # אין פנים בתמונה

        # שלב 2: טעינת embeddings מוכרים (מ-cache או DB)
        known_embeddings = await self._load_known_embeddings()

        # שלב 3: השוואת כל פנים שזוהו מול כל איש קשר מוכר
        results = []
        for face_embedding, bbox in detected_faces:
            result = await self._match_face(face_embedding, bbox, known_embeddings)
            results.append(result)

        return results

    async def _load_known_embeddings(self) -> list[tuple[UUID, np.ndarray]]:
        """
        טוען embeddings מ-Redis cache.
        אם ה-cache ריק — טוען מה-DB ושומר ב-cache.
        """
        # ניסיון לטעון מ-cache קודם
        cached = await self._cache.get_all_embeddings()
        if cached is not None:
            return cached  # cache hit — מהיר!

        # cache miss — טוענים מה-DB
        logger.debug("Cache miss — loading embeddings from database")
        db_embeddings = await self._store.get_all_embeddings()

        # שומרים ב-cache לבקשות הבאות
        if db_embeddings:
            await self._cache.set_all_embeddings(db_embeddings)

        return db_embeddings

    async def _match_face(
        self,
        face_embedding: np.ndarray,
        bbox: tuple[int, int, int, int],
        known_embeddings: list[tuple[UUID, np.ndarray]]
    ) -> FaceDetectionResponse:
        """
        משווה פנים אחד מול כל אנשי הקשר המוכרים.
        מחזיר FaceDetectionResponse עם פרטי הזיהוי.
        """
        x, y, w, h = bbox
        bounding_box = BoundingBox(x=x, y=y, width=w, height=h)

        if not known_embeddings:
            # אין אנשי קשר רשומים כלל
            return FaceDetectionResponse(
                person_id=None,
                person_name=None,
                confidence=0.0,
                bounding_box=bounding_box,
                is_known=False
            )

        # חישוב cosine similarity מול כל איש קשר
        best_id, best_similarity = self._find_best_match(face_embedding, known_embeddings)

        if best_similarity >= settings.recognition_threshold:
            # אדם מוכר! — צריך לשלוף את שמו מה-DB
            contact = await self._store.find_match(face_embedding, settings.recognition_threshold)

            if contact:
                return FaceDetectionResponse(
                    person_id=contact.id,
                    person_name=contact.name,
                    confidence=best_similarity,
                    bounding_box=bounding_box,
                    is_known=True
                )

        # אדם לא מוכר
        return FaceDetectionResponse(
            person_id=None,
            person_name=None,
            confidence=best_similarity,
            bounding_box=bounding_box,
            is_known=False
        )

    def _find_best_match(
        self,
        query_embedding: np.ndarray,
        known_embeddings: list[tuple[UUID, np.ndarray]]
    ) -> tuple[UUID, float]:
        """
        חישוב cosine similarity בין query לכל ה-embeddings המוכרים.
        מחזיר (UUID, similarity) של ההתאמה הטובה ביותר.

        cosine similarity = (A · B) / (|A| × |B|)
        תוצאה בין 0 (שונה לחלוטין) ל-1 (זהה)
        """
        # נרמול ה-query embedding לאורך 1 (יעיל חישובית)
        query_norm = query_embedding / (np.linalg.norm(query_embedding) + 1e-8)

        best_id = None
        best_similarity = -1.0

        for contact_id, known_embedding in known_embeddings:
            # נרמול ה-known embedding
            known_norm = known_embedding / (np.linalg.norm(known_embedding) + 1e-8)

            # מכפלה פנימית של וקטורים מנורמלים = cosine similarity
            similarity = float(np.dot(query_norm, known_norm))

            if similarity > best_similarity:
                best_similarity = similarity
                best_id = contact_id

        return best_id, best_similarity