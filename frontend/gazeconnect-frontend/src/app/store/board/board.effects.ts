import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';

import { AacBoardService } from '../../features/aac-board/services/aac-board.service';
import { TtsService } from '../../shared/services/tts.service';
import { BoardActions } from './board.actions';

@Injectable()
export class BoardEffects {
    private actions$ = inject(Actions);
    private aacBoardService = inject(AacBoardService);
    private ttsService = inject(TtsService);

    // ── טעינת לוח פעיל מהשרת ─────────────────────────────────
    loadBoard$ = createEffect(() =>
        this.actions$.pipe(
            ofType(BoardActions.loadBoard),
            switchMap(({ userId }) =>
                this.aacBoardService.getActiveBoard(userId).pipe(
                    map(board => BoardActions.loadBoardSuccess({ board })),
                    catchError(err => {                                          // ← החלף את השורה הזו
                        const error = err instanceof Error ? err.message : 'שגיאה בטעינת המוח';
                        return of(BoardActions.loadBoardFailure({ error }));
                    }
                    )
                )
            )
        )
    );

    // ── לחיצת כפתור → שליחה לשרת + TTS ─────────────────────
    buttonPressed$ = createEffect(() =>
        this.actions$.pipe(
            ofType(BoardActions.buttonPressed),
            switchMap(({ buttonId, userId }) =>
                this.aacBoardService.pressButton(buttonId, userId).pipe(
                    map(() => BoardActions.buttonPressedSuccess()),
                    catchError(err => {                                          // ← החלף את השורה הזו
                        const error = err instanceof Error ? err.message : 'שגיאה בשליחת לחיצה';
                        return of(BoardActions.buttonPressedFailure({ error }));
                    })))
        )
    );

    // ── עדכון לוח מ-SignalR → עדכון ב-store + TTS ─────────────
   
}