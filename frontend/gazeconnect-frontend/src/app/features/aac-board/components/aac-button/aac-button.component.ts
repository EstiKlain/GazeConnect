import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy, ChangeDetectorRef,
  inject, OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { ButtonDto } from '../../../../shared/models/board.dto.model';
import { BoardLayout } from '../../../../shared/models/board-layout.model';
import { selectDwellMs } from '../../../../store/scanning/scanning.reducer';

@Component({
  selector: 'gc-aac-button',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './aac-button.component.html',
  styleUrl:    './aac-button.component.scss',
})
export class AacButtonComponent implements OnDestroy {
  @Input({ required: true }) button!: ButtonDto;
  @Input() size: BoardLayout['buttonSize'] = 'large';
  @Output() buttonClick = new EventEmitter<ButtonDto>();

  isDwelling = false;
  private dwellMs = 900;
  private dwellTimer: ReturnType<typeof setTimeout> | null = null;
  private cdr   = inject(ChangeDetectorRef);
  private store = inject(Store);
  private sub!: Subscription;

  constructor() {
    this.sub = this.store.select(selectDwellMs)
      .subscribe(ms => this.dwellMs = ms);
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    this.cancelDwell();  // ← חייב שתהיה מוגדרת למטה
  }

  onMouseEnter(): void { this.startDwell(); }
  onMouseLeave(): void { this.cancelDwell(); }

  startDwell(): void {
    if (this.isDwelling) return;
    this.isDwelling = true;
    this.cdr.markForCheck();
    this.dwellTimer = setTimeout(() => {
      this.buttonClick.emit(this.button);
      this.isDwelling = false;
      this.cdr.markForCheck();
    }, this.dwellMs);
  }

  cancelDwell(): void {
    this.isDwelling = false;
    if (this.dwellTimer) {
      clearTimeout(this.dwellTimer);
      this.dwellTimer = null;
    }
    this.cdr.markForCheck();
  }
}