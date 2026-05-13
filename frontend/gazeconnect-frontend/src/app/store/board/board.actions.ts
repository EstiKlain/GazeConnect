import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { BoardDto, ButtonDto } from '../../shared/models/board.dto.model';

export const BoardActions = createActionGroup({
  source: 'Board',
  events: {
    // ── טעינת לוח ────────────────────────────────────────────
    'Load Board':         props<{ userId: string }>(),
    'Load Board Success': props<{ board: BoardDto }>(),
    'Load Board Failure': props<{ error: string }>(),

    // ── לחיצת כפתור ──────────────────────────────────────────
    'Button Pressed':         props<{ buttonId: string; userId: string }>(),
    'Button Pressed Success': emptyProps(),
    'Button Pressed Failure': props<{ error: string }>(),

    // ── עדכון מ-SignalR ───────────────────────────────────────
    'Board Updated Via SignalR': props<{ board: BoardDto }>(),
    'Button Added Via SignalR':  props<{ button: ButtonDto }>(),
  },
});