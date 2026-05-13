export interface ContactDto {
    id: string;// מזהה האדם מה-DB (null אם לא מוכר)
    userId: string;// משתמש שהאדם שייך אליו
    name: string;// שם לתצוגה על הכפתור (null אם לא מוכר)
    role?: string | null;// תפקיד או תאריך במערכת (null אם לא מוכר)
    /** אופציונלי כשיהיה בשירות */
    avatarUrl?: string | null;// נתיב לתמונה: "/photos/uuid.jpg"
  }