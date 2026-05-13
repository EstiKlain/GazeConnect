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
  templateUrl: './aac-button.component.html',
  styleUrl: './aac-button.component.scss',
})
export class AacButtonComponent {
  @Input({ required: true }) button!: ButtonDto;
  @Input() size: BoardLayout['buttonSize'] = 'large';
  @Output() buttonClick = new EventEmitter<ButtonDto>();
}