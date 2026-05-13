// board.component.ts
import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';

import { BoardActions } from '../../../../store/board/board.actions';
import { selectVisibleButtons, selectLayout, selectLoading, selectError } from '../../../../store/board/board.selectors';
import { AacButtonComponent } from '../aac-button/aac-button.component';
import { ButtonDto } from '../../../../shared/models/board.dto.model';
import { TtsService } from '../../../../shared/services/tts.service';

// userId זמני לפיתוח — יוחלף ב-AuthService בשלב 4
const DEV_USER_ID = '00000000-0000-0000-0000-000000000001';

@Component({
  selector: 'gc-board',
  standalone: true,
  imports: [CommonModule, AacButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="board-container" [attr.dir]="'rtl'">

      @if (loading$ | async) {
        <div class="board-loading" role="status" aria-live="polite">
          <span>טוען לוח...</span>
        </div>
      }

      @if (error$ | async; as error) {
        <div class="board-error" role="alert">
          <span>{{ error }}</span>
          <button (click)="retry()">נסה שוב</button>
        </div>
      }

      @if (layout$ | async; as layout) {
        <div
          class="board-grid"
          [style.grid-template-columns]="'repeat(' + layout.columns + ', 1fr)'"
          [attr.aria-label]="'לוח תקשורת, ' + layout.maxButtons + ' כפתורים'"
          role="grid"
        >
          @for (button of buttons$ | async; track button.id) {
            <gc-aac-button
              [button]="button"
              [size]="layout.buttonSize"
              (buttonClick)="onButtonClick($event)"
            />
          }
        </div>
      }

    </div>
  `,
  styleUrl: './board.component.scss',
})
export class BoardComponent implements OnInit {
  private store = inject(Store);
  private tts   = inject(TtsService);

  buttons$ = this.store.select(selectVisibleButtons);
  layout$  = this.store.select(selectLayout);
  loading$ = this.store.select(selectLoading);
  error$   = this.store.select(selectError);

  ngOnInit(): void {
    this.store.dispatch(BoardActions.loadBoard({ userId: DEV_USER_ID }));
  }

  onButtonClick(button: ButtonDto): void {
    // 1. TTS מיידי — לא מחכה לתגובת השרת
    this.tts.speakButton(button.text, button.ttsText);

    // 2. dispatch לstore → effect שולח לשרת
    this.store.dispatch(BoardActions.buttonPressed({
      buttonId: button.id,
      userId:   DEV_USER_ID,
    }));
  }

  retry(): void {
    this.store.dispatch(BoardActions.loadBoard({ userId: DEV_USER_ID }));
  }
}