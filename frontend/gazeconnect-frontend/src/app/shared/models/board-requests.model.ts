// shared/models/board-requests.model.ts
// כל מה שנשלח לשרת (POST body)
// נפרד מה-DTOs שמגיעים משם

export interface LogButtonPressRequest {
  userId: string;
  context: string; // JSON string, ברירת מחדל "{}"
}