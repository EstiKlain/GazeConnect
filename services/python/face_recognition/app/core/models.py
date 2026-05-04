# ──────────────────────────────────────────────────────────────
# core/models.py
#
# מטרה: הגדרת כל מבני הנתונים שהשירות משתמש בהם.
# אלו הם ה-"שפה המשותפת" של כל הקוד — כל פונקציה מקבלת
# ומחזירה את ה-models האלה.
#
# הפרדה חשובה:
#   Contact       = איש קשר כפי שנשמר ב-DB
#   FaceDetection = תוצאת זיהוי מ-InsightFace (לפני שיוח ל-C#)
#   RecognizeResponse = מה שנשלח ל-C# בתשובה ל-/recognize
# ──────────────────────────────────────────────────────────────

from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional


# ── Contact ────────────────────────────────────────────────────
class Contact(BaseModel):
    """
    איש קשר מוכר במערכת.
    נשמר בטבלת contacts ב-PostgreSQL.
    """
    id: UUID                          # מזהה ייחודי — גם PersonId ב-C#
    name: str                         # שם לתצוגה על הכפתור: "אמא", "מרים"
    photo_url: Optional[str] = None   # נתיב לתמונה: "/photos/uuid.jpg"
    enrolled_at: datetime             # מתי נרשם


# ── BoundingBox ────────────────────────────────────────────────
class BoundingBox(BaseModel):
    """
    מיקום הפנים בתמונה — חייב להתאים בדיוק ל-C# BoundingBox record.
    C# מצפה לשדות: x, y, width, height (אותיות קטנות — JSON serialization).
    """
    x: int       # נקודת ההתחלה — ציר אופקי
    y: int       # נקודת ההתחלה — ציר אנכי
    width: int   # רוחב המלבן
    height: int  # גובה המלבן


# ── FaceDetectionResponse ──────────────────────────────────────
class FaceDetectionResponse(BaseModel):
    """
    תשובה אחת של זיהוי פנים — בדיוק מה ש-C# מצפה לקבל.

    חשוב מאוד: שמות השדות כאן חייבים להתאים ל-FaceDetectionDto ב-C#:
      person_id   → PersonId
      person_name → PersonName
      confidence  → Confidence
      bounding_box → BoundingBox
      is_known    → IsKnown

    FastAPI ממיר אוטומטית snake_case → camelCase ב-JSON.
    """
    person_id: Optional[UUID] = None       # null אם לא מוכר
    person_name: Optional[str] = None     # null אם לא מוכר
    confidence: float                      # 0.0 עד 1.0
    bounding_box: BoundingBox             # מיקום הפנים בתמונה
    is_known: bool                         # האם מעל סף הזיהוי


# ── EnrollRequest (metadata) ───────────────────────────────────
class EnrollResponse(BaseModel):
    """
    תשובה ל-POST /enroll — מאשרת שהאדם נרשם בהצלחה.
    """
    contact_id: UUID    # ה-ID החדש שנוצר
    name: str           # השם שנרשם
    photo_url: str      # נתיב התמונה שנשמרה
    message: str        # הודעת אישור


# ── ContactResponse ────────────────────────────────────────────
class ContactResponse(BaseModel):
    """
    תשובה ל-GET /contacts — פרטי איש קשר לתצוגה.
    לא כולל את ה-embedding (וקטור 512 מספרים) כי הוא גדול ולא נחוץ ל-UI.
    """
    id: UUID
    name: str
    photo_url: Optional[str] = None
    enrolled_at: datetime