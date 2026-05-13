import { createReducer, on } from '@ngrx/store';
import {  BoardLayout, DEFAULT_LAYOUT } from '../../shared/models/board-layout.model';
import{BoardDto} from '../../shared/models/board.dto.model';
import { BoardActions } from './board.actions';

export interface BoardState {
  board:    BoardDto | null;
  layout:   BoardLayout;          // מגיע מה-board.layout JSON, מוגדר ע"י קלינאית
  loading:  boolean;
  error:    string | null;
  lastPressedButtonId: string | null;
}

const initialState: BoardState = {
  board:               null,
  layout:              DEFAULT_LAYOUT,
  loading:             false,
  error:               null,
  lastPressedButtonId: null,
};

// parse של layout JSON מהשרת — עם fallback ל-default
function parseLayout(layoutJson: string): BoardLayout {
  try {
    const parsed = JSON.parse(layoutJson);
    return {
      maxButtons: parsed.maxButtons ?? DEFAULT_LAYOUT.maxButtons,
      columns:    parsed.columns    ?? DEFAULT_LAYOUT.columns,
      buttonSize: parsed.buttonSize ?? DEFAULT_LAYOUT.buttonSize,
    };
  } catch {
    return DEFAULT_LAYOUT;
  }
}

export const boardReducer = createReducer(
  initialState,

  on(BoardActions.loadBoard, (state) => ({
    ...state,
    loading: true,
    error:   null,
  })),

  on(BoardActions.loadBoardSuccess, (state, { board }) => ({
    ...state,
    board,
    layout:  parseLayout(board.layout),
    loading: false,
    error:   null,
  })),

  on(BoardActions.loadBoardFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(BoardActions.buttonPressed, (state, { buttonId }) => ({
    ...state,
    lastPressedButtonId: buttonId,
  })),

  // עדכון מ-SignalR — מחליף את הלוח כולו
  on(BoardActions.boardUpdatedViaSignalR, (state, { board }) => ({
    ...state,
    board,
    layout: parseLayout(board.layout),
  })),

  // כפתור חדש הגיע מ-SignalR — מוסיף לרשימה
  on(BoardActions.buttonAddedViaSignalR, (state, { button }) => ({
    ...state,
    board: state.board
      ? { ...state.board, buttons: [...state.board.buttons, button] }
      : state.board,
  })),
);