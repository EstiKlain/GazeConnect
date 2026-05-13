/** תואם ל-GazeConnect.Shared.DTOs.FaceDetectionResult (JSON camelCase) */
export interface BoundingBoxDto {
    x: number; // נקודת ההתחלה — ציר אופקי
    y: number; // נקודת ההתחלה — ציר אנכי
    width: number; // רוחב המלבן
    height: number; // גובה המלבן
  }
  
  export interface FaceDetectionResultDto {
    personId: string | null;   // Guid מהשרת → string ב-JSON
    personName: string | null;// אם ידוע, השם של האדם שזוהה
    confidence: number;// כמה בטוח הזיהוי (0.0 עד 1.0)
    boundingBox: BoundingBoxDto;// איפה הפנים בתמונה — מיקום וגודל
    timestampMs: number;// מתי זוהה האדם (בזמן אמת)
    isKnown: boolean;// האם האדם מוכר במערכת
  }