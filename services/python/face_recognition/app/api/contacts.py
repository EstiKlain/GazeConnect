# ──────────────────────────────────────────────────────────────
# api/contacts.py
#
# מטרה: endpoints לניהול אנשי קשר (קריאה ומחיקה).
#
# GET  /contacts       → רשימת כל אנשי הקשר (לתצוגה ב-Admin Panel)
# DELETE /contacts/{id} → מחיקת איש קשר
# ──────────────────────────────────────────────────────────────

from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID
from app.core.models import ContactResponse
from app.infrastructure.postgres_store import PostgresContactStore
from app.infrastructure.redis_cache import RedisEmbeddingCache
from app.api.dependencies import get_contact_store, get_cache
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get(
    "/contacts",
    response_model=list[ContactResponse],
    summary="Get all known contacts",
    description="Returns all enrolled contacts without their embeddings."
)
async def get_contacts(
    store: PostgresContactStore = Depends(get_contact_store)
) -> list[ContactResponse]:
    """
    מחזיר את כל אנשי הקשר המוכרים.
    ה-Admin Panel משתמש בזה להציג את הרשימה.
    ה-AAC Board משתמש בזה להציג כפתורי אנשים.
    """
    contacts = await store.get_all_contacts()

    return [
        ContactResponse(
            id=c.id,
            name=c.name,
            photo_url=c.photo_url,
            enrolled_at=c.enrolled_at
        )
        for c in contacts
    ]


@router.delete(
    "/contacts/{contact_id}",
    status_code=204,
    summary="Delete a contact",
    description="Removes a contact and invalidates the recognition cache."
)
async def delete_contact(
    contact_id: UUID,
    store: PostgresContactStore = Depends(get_contact_store),
    cache: RedisEmbeddingCache = Depends(get_cache)
) -> None:
    """
    מוחק איש קשר לפי ID.
    מנקה את ה-cache כדי שהזיהוי יעודכן מיד.
    """
    deleted = await store.delete_contact(contact_id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail=f"Contact {contact_id} not found"
        )

    # ניקוי cache — הזיהוי לא יזהה עוד את האדם הזה
    await cache.invalidate()

    logger.info("Deleted contact id=%s", contact_id)
    # 204 No Content — אין body בתשובה