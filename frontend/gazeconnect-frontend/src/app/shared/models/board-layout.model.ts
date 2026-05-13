// shared/models/board-layout.model.ts
// Layout מגיע מהשרת כ-JSON string ומפורסר ב-reducer
// DEFAULT_LAYOUT — כשאין הגדרה (קלינאית עוד לא הגדירה)

export interface BoardLayout {
  maxButtons: number;
  columns: number;
  buttonSize: 'small' | 'medium' | 'large';
}

export const DEFAULT_LAYOUT: BoardLayout = {
  maxButtons: 9,
  columns: 3,
  buttonSize: 'large',
};