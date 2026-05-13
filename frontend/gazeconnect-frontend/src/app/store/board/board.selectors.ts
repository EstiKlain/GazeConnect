import { createFeatureSelector, createSelector } from '@ngrx/store';
import { BoardState } from './board.reducer';

export const selectBoardState = createFeatureSelector<BoardState>('board');
// Selectors
export const selectBoard        = createSelector(selectBoardState, s => s.board);//הסלקטור הזה מחזיר את כל ה-board, כולל ה-buttons שבתוכו
export const selectLayout       = createSelector(selectBoardState, s => s.layout);//הסלקטור הזה מחזיר את ה-layout של הלוח, שמגיע מהשרת ומוגדר ע"י קלינאית התקשורת
export const selectLoading      = createSelector(selectBoardState, s => s.loading);//הסלקטור הזה מחזיר אם הלוח בטעינה או לא, כדי שהקומפוננטה תוכל להראות "טוען..." בזמן הטעינה  
export const selectError        = createSelector(selectBoardState, s => s.error);//הסלקטור הזה מחזיר את הודעת השגיאה אם טעינת הלוח נכשלה, כדי שהקומפוננטה תוכל להראות את ההודעה למשתמש
export const selectLastPressed  = createSelector(selectBoardState, s => s.lastPressedButtonId);//הסלקטור הזה מחזיר את ה-ID של הכפתור שנלחץ לאחרונה, כדי שהקומפוננטה תוכל להראות ויזואלית איזה כפתור נלחץ (למשל, עם אנימציה קצרה או שינוי צבע)

// כפתורים מוגבלים לפי maxButtons מה-layout — זה ה-selector שה-BoardComponent משתמש בו
export const selectVisibleButtons = createSelector(
  selectBoard,
  selectLayout,
  (board, layout) => board?.buttons.slice(0, layout.maxButtons) ?? []
);