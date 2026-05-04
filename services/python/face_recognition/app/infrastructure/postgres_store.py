# ──────────────────────────────────────────────────────────────
# infrastructure/postgres_store.py
#
# מטרה: מימוש IContactStore — שמירה וחיפוש אנשי קשר ב-PostgreSQL.
#
# הטבלה contacts נוצרת אוטומטית בהפעלה הראשונה (CREATE TABLE IF NOT EXISTS).
# אין צורך ב-migrations ידניים!
#
# טכנולוגיות:
#   asyncpg  = חיבור async מהיר ל-PostgreSQL
#   pgvector = תמיכה בסוג עמודה vector(512) לחישוב דמיון
#
# חישוב דמיון:
#   cosine similarity = מדד דמיון בין שני וקטורים (0 עד 1)
#   מחושב ישירות ב-SQL עם operator <=> של pgvector
#   ביצועים: O(n) על CPU — מספיק לעשרות אנשי קשר
# ──────────────────────────────────────────────────────────────

import asyncpg
import numpy as np
from uuid import UUID, uuid4
from datetime import datetime, timezone
from typing import Optional
import logging

from app.core.interfaces import IContactStore
from app.core.models import Contact
from app.config import settings

logger = logging.getLogger(__name__)


class PostgresContactStore(IContactStore):
    """
    שמירה וחיפוש של אנשי קשר ב-PostgreSQL עם pgvector.
    """

    def __init__(self, pool: asyncpg.Pool):
        # pool = מאגר חיבורים — כל בקשה לוקחת חיבור פנוי מהמאגר
        # ומחזירה אותו בסיום (יעיל יותר מחיבור חדש בכל בקשה)
        self._pool = pool

    async def initialize(self) -> None:
        """
        יוצר את טבלת contacts אם לא קיימת.
        נקרא פעם אחת בהפעלת השירות.
        """
        async with self._pool.acquire() as conn:
            # הפעלת pgvector extension — חובה לפני שימוש בסוג vector
            await conn.execute("CREATE EXTENSION IF NOT EXISTS vector")

            # יצירת הטבלה — IF NOT EXISTS = לא ייכשל אם כבר קיים
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS contacts (
                    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name        TEXT NOT NULL,
                    embedding   vector(512) NOT NULL,
                    photo_url   TEXT,
                    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            """)

            # אינדקס לחיפוש מהיר לפי דמיון וקטורי
            # ivfflat = אינדקס מהיר, מתאים לעד כמה אלפי רשומות
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS contacts_embedding_idx
                ON contacts USING ivfflat (embedding vector_cosine_ops)
                WITH (lists = 10)
            """)

        logger.info("Database initialized: contacts table ready.")

    async def find_match(
        self,
        embedding: np.ndarray,
        threshold: float
    ) -> Optional[Contact]:
        """
        מחפש את איש הקשר הכי דומה ל-embedding.
        משתמש ב-cosine similarity של pgvector.

        <=> = cosine distance (1 - similarity)
        לכן: distance קטן = דמיון גבוה
        threshold 0.5 similarity = distance 0.5
        """
        # המרת numpy array לפורמט שpgvector מקבל: "[0.1, 0.2, ...]"
        embedding_str = "[" + ",".join(map(str, embedding.tolist())) + "]"

        async with self._pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT id, name, photo_url, enrolled_at,
                       1 - (embedding <=> $1::vector) AS similarity
                FROM contacts
                ORDER BY embedding <=> $1::vector
                LIMIT 1
            """, embedding_str)

        if row is None:
            return None  # אין אנשי קשר בכלל ב-DB

        similarity = float(row["similarity"])
        logger.debug("Best match: '%s' with similarity %.3f", row["name"], similarity)

        if similarity < threshold:
            return None  # הכי דומה, אבל עדיין מתחת לסף

        return Contact(
            id=row["id"],
            name=row["name"],
            photo_url=row["photo_url"],
            enrolled_at=row["enrolled_at"]
        )

    async def save_contact(
        self,
        name: str,
        embedding: np.ndarray,
        photo_url: str
    ) -> Contact:
        """
        שומר איש קשר חדש ומחזיר אותו עם ה-ID שנוצר.
        """
        embedding_str = "[" + ",".join(map(str, embedding.tolist())) + "]"
        now = datetime.now(timezone.utc)

        async with self._pool.acquire() as conn:
            row = await conn.fetchrow("""
                INSERT INTO contacts (name, embedding, photo_url, enrolled_at)
                VALUES ($1, $2::vector, $3, $4)
                RETURNING id, name, photo_url, enrolled_at
            """, name, embedding_str, photo_url, now)

        logger.info("Saved new contact: '%s' (id=%s)", row["name"], row["id"])

        return Contact(
            id=row["id"],
            name=row["name"],
            photo_url=row["photo_url"],
            enrolled_at=row["enrolled_at"]
        )

    async def get_all_contacts(self) -> list[Contact]:
        """
        מחזיר את כל אנשי הקשר — בלי embeddings.
        """
        async with self._pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT id, name, photo_url, enrolled_at
                FROM contacts
                ORDER BY enrolled_at DESC
            """)

        return [
            Contact(
                id=row["id"],
                name=row["name"],
                photo_url=row["photo_url"],
                enrolled_at=row["enrolled_at"]
            )
            for row in rows
        ]

    async def get_all_embeddings(self) -> list[tuple[UUID, np.ndarray]]:
        """
        מחזיר כל ה-embeddings מה-DB — לשימוש ב-cache.
        """
        async with self._pool.acquire() as conn:
            rows = await conn.fetch("SELECT id, embedding FROM contacts")

        result = []
        for row in rows:
            # pgvector מחזיר את ה-embedding כ-string "[0.1, 0.2, ...]"
            # ממיר חזרה ל-numpy array
            emb_str = row["embedding"]
            values = [float(x) for x in emb_str.strip("[]").split(",")]
            result.append((row["id"], np.array(values, dtype=np.float32)))

        return result

    async def delete_contact(self, contact_id: UUID) -> bool:
        """
        מוחק איש קשר לפי ID.
        מחזיר True אם נמחק, False אם לא נמצא.
        """
        async with self._pool.acquire() as conn:
            result = await conn.execute(
                "DELETE FROM contacts WHERE id = $1", contact_id
            )

        # result = "DELETE 1" אם נמחק, "DELETE 0" אם לא נמצא
        deleted = result == "DELETE 1"
        if deleted:
            logger.info("Deleted contact id=%s", contact_id)
        return deleted