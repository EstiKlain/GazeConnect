// shared/models/board.dto.model.ts
// DTO-ים שמגיעים מהשרת — BoardService מחזיר אותם ישירות
// לא לערבב עם layout/defaults/requests

export interface ButtonDto {
  id: string;
  boardId: string;
  text: string;
  category: string;
  icon: string | null;
  ttsText: string | null;
  isContextual: boolean;
  personId: string | null;
  createdAt: string;
}

export interface BoardDto {
  id: string;
  userId: string;
  name: string;
  layout: string;   // JSON string מהשרת — לפרסר ב-board.reducer
  buttons: ButtonDto[];
  createdAt: string;
  updatedAt: string;
}