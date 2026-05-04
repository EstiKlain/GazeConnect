# ──────────────────────────────────────────────────────────────
# core/interfaces.py
#
# מטרה: הגדרת "חוזים" (interfaces) שכל implementation חייב לממש.
# זה מאפשר להחליף implementations בלי לשנות קוד אחר —
# למשל: להחליף InsightFace בספרייה אחרת מחר בלי לגעת ב-API.
#
# Python לא כולל interfaces כמו C#, אבל ABC (Abstract Base Class)
# נותן את אותה התנהגות.
# ──────────────────────────────────────────────────────────────

from abc import ABC, abstractmethod
from typing import Optional
import numpy as np
from uuid import UUID
from .models import Contact, FaceDetectionResponse


# ── IFaceDetector ──────────────────────────────────────────────
class IFaceDetector(ABC):
    """
    חוזה לזיהוי פנים מתמונה.
    Implementation: InsightFaceDetector (insightface_detector.py)
    """

    @abstractmethod
    async def detect_and_embed(self, image_bytes: bytes) -> list[tuple[np.ndarray, tuple]]:
        """
        מקבל: bytes של תמונה (JPEG/PNG)
        מחזיר: רשימה של (embedding_vector, bounding_box)
          embedding_vector = np.ndarray בגודל 512 — ייצוג מספרי של הפנים
          bounding_box = (x, y, width, height)
        """
        ...


# ── IContactStore ──────────────────────────────────────────────
class IContactStore(ABC):
    """
    חוזה לשמירה וחיפוש של אנשי קשר ב-DB.
    Implementation: PostgresContactStore (postgres_store.py)
    """

    @abstractmethod
    async def find_match(
        self,
        embedding: np.ndarray,
        threshold: float
    ) -> Optional[Contact]:
        """
        מחפש את איש הקשר הכי דומה ל-embedding נתון.
        מחזיר Contact אם נמצא מעל הסף, None אחרת.
        """
        ...

    @abstractmethod
    async def save_contact(
        self,
        name: str,
        embedding: np.ndarray,
        photo_url: str
    ) -> Contact:
        """
        שומר איש קשר חדש ב-DB.
        מחזיר את ה-Contact עם ה-ID החדש שנוצר.
        """
        ...

    @abstractmethod
    async def get_all_contacts(self) -> list[Contact]:
        """
        מחזיר את כל אנשי הקשר (בלי embeddings — רק מידע לתצוגה).
        """
        ...

    @abstractmethod
    async def delete_contact(self, contact_id: UUID) -> bool:
        """
        מוחק איש קשר לפי ID.
        מחזיר True אם נמחק, False אם לא נמצא.
        """
        ...


# ── IEmbeddingCache ────────────────────────────────────────────
class IEmbeddingCache(ABC):
    """
    חוזה ל-cache של embeddings ב-Redis.
    מטרה: לא לטעון את כל ה-embeddings מה-DB בכל בקשה.
    Implementation: RedisEmbeddingCache (redis_cache.py)
    """

    @abstractmethod
    async def get_all_embeddings(self) -> Optional[list[tuple[UUID, np.ndarray]]]:
        """
        מחזיר את כל ה-embeddings מה-cache.
        None אם ה-cache ריק או פג תוקף.
        """
        ...

    @abstractmethod
    async def set_all_embeddings(self, embeddings: list[tuple[UUID, np.ndarray]]) -> None:
        """
        שומר את כל ה-embeddings ב-cache (TTL: 5 דקות).
        """
        ...

    @abstractmethod
    async def invalidate(self) -> None:
        """
        מנקה את ה-cache — קורה אחרי enroll או delete.
        """
        ...