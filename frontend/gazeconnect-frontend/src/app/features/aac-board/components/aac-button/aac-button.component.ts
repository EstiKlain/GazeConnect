// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// aac-button.component.ts — כפתור בודד, גדול, נגיש לילדים
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonDto } from '../../../../shared/models/board.dto.model';
import { BoardLayout } from '../../../../shared/models/board-layout.model';
@Component({
  selector: 'gc-aac-button',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      class="aac-btn"
      [class]="'aac-btn aac-btn--' + size"
      [attr.aria-label]="button.text"
      [attr.data-category]="button.category"
      (click)="buttonClick.emit(button)"
      (keydown.enter)="buttonClick.emit(button)"
      (keydown.space)="buttonClick.emit(button)"
    >
      @if (button.icon) {
        <img
          class="aac-btn__icon"
          [src]="button.icon"
          [alt]="button.text"
          loading="lazy"
        />
      } @else {
        <span class="aac-btn__icon-placeholder" aria-hidden="true">
          {{ button.text.charAt(0) }}
        </span>
      }
      <span class="aac-btn__text">{{ button.text }}</span>
    </button>
  `,
  styleUrl: './aac-button.component.scss',
})
export class AacButtonComponent {
  @Input({ required: true }) button!: ButtonDto;
  @Input() size: BoardLayout['buttonSize'] = 'large';
  @Output() buttonClick = new EventEmitter<ButtonDto>();
}