// import {
//   Component, Input, Output, EventEmitter,
//   ChangeDetectionStrategy, ChangeDetectorRef,
//   inject, OnDestroy,ElementRef,OnInit
// } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { Store } from '@ngrx/store';
// import { Subscription } from 'rxjs';
// import { ButtonDto } from '../../../../shared/models/board.dto.model';
// import { BoardLayout } from '../../../../shared/models/board-layout.model';
// import { selectDwellMs } from '../../../../store/scanning/scanning.reducer';
// import { DwellTimeService } from '../../../../shared/services/dwell-time.service';
// import { selectGazeActive } from '../../../../store/gaze/gaze.reducer';
// @Component({
//   selector: 'gc-aac-button',
//   standalone: true,
//   imports: [CommonModule],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   templateUrl: './aac-button.component.html',
//   styleUrl:    './aac-button.component.scss',
// })
// export class AacButtonComponent implements OnDestroy {
//   @Input({ required: true }) button!: ButtonDto;
//   @Input() size: BoardLayout['buttonSize'] = 'large';
//   @Output() buttonClick = new EventEmitter<ButtonDto>();

//   dwellProgress = 0;// progress  0–1 DwellTimeService מגיע מ
//   isGazeActive = false;// האם Eye Tracking פעיל
//    isDwelling = false;
//   private dwellMs = 900;
//   private dwellTimer: ReturnType<typeof setTimeout> | null = null;
//   private cdr   = inject(ChangeDetectorRef);
//   private store = inject(Store);
//   private sub!: Subscription;
//   private el = inject(ElementRef);
//   private dwellSvc = inject(DwellTimeService);


//   constructor() {
//     this.sub = this.store.select(selectDwellMs)
//       .subscribe(ms => this.dwellMs = ms);
//   }

//   ngOnDestroy(): void {
//     this.sub.unsubscribe();
//     this.cancelDwell();  // ← חייב שתהיה מוגדרת למטה
//   }

//   onMouseEnter(): void { this.startDwell(); }
//   onMouseLeave(): void { this.cancelDwell(); }

//   startDwell(): void {
//     if (this.isDwelling) return;
//     this.isDwelling = true;
//     this.cdr.markForCheck();
//     this.dwellTimer = setTimeout(() => {
//       this.buttonClick.emit(this.button);
//       this.isDwelling = false;
//       this.cdr.markForCheck();
//     }, this.dwellMs);
//   }

//   cancelDwell(): void {
//     this.isDwelling = false;
//     if (this.dwellTimer) {
//       clearTimeout(this.dwellTimer);
//       this.dwellTimer = null;
//     }
//     this.cdr.markForCheck();
//   }
// }

import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy, ChangeDetectorRef,
  inject, OnDestroy, OnInit, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { ButtonDto } from '../../../../shared/models/board.dto.model';
import { BoardLayout } from '../../../../shared/models/board-layout.model';
import { selectDwellMs } from '../../../../store/scanning/scanning.reducer';
import { DwellTimeService } from '../../../../shared/services/dwell-time.service';
import { selectGazeActive } from '../../../../store/gaze/gaze.reducer';
import { AfterViewInit } from '@angular/core';
@Component({
  selector: 'gc-aac-button',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './aac-button.component.html',
  styleUrl: './aac-button.component.scss',
})
export class AacButtonComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input({ required: true }) button!: ButtonDto;
  @Input() size: BoardLayout['buttonSize'] = 'large';
  @Output() buttonClick = new EventEmitter<ButtonDto>();

  dwellProgress = 0;   // 0–1 — לאנימציית הפס
  isDwelling = false;//האם כרגע שוהים על הכפתור
  isGazeActive = false;// האם Eye Tracking פעיל

  private dwellMs = 900;
  private cdr = inject(ChangeDetectorRef);
  private store = inject(Store);
  private el = inject(ElementRef);
  private dwellSvc = inject(DwellTimeService);
  private subs = new Subscription();///מנהל כל ה-subscriptions

  ngOnInit(): void {
    // 1. מאזין לשינוי dwellMs מה-store
    this.subs.add(
      this.store.select(selectDwellMs).subscribe(ms => {
        this.dwellMs = ms;
        // this.registerDwell();
      })
    );

    // סטטוס eye tracking (להסתיר cursor)
    this.subs.add(
      this.store.select(selectGazeActive).subscribe(active => {
        this.isGazeActive = active;
        this.cdr.markForCheck();//רנדר מחדש
      })
    );

    // progress מה-DwellTimeService
    this.subs.add(
      this.dwellSvc.dwellProgress$.subscribe(({ id, progress }) => {
        if (id === this.button.id) {//רק הכפתור הזה
          this.dwellProgress = progress;//0->1
          this.isDwelling = progress > 0;
          this.cdr.markForCheck();
        }
      })
    );

    // this.registerDwell();
  }

  ngAfterViewInit(): void {
    // עכשיו ה-DOM קיים — getBoundingClientRect() יחזיר ערכים אמיתיים
    setTimeout(() => this.registerDwell(), 100);
  }
  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.dwellSvc.unregister(this.button.id);
    this.cancelMouseDwell();
  }

  // ── Mouse fallback (כשאין Eye Tracking) ──────────────────────
  onMouseEnter(): void { if (!this.isGazeActive) this.startMouseDwell(); }
  onMouseLeave(): void { if (!this.isGazeActive) this.cancelMouseDwell(); }

  private registerDwell(): void {
    if (!this.button) return;
    const rect = (this.el.nativeElement as HTMLElement).getBoundingClientRect();
    const el = (this.el.nativeElement as HTMLElement);
    const parent = el.closest('.board-cell') as HTMLElement ?? el
    console.log('[Register]', this.button.id, rect.left, rect.top, rect.right, rect.bottom);

    // this.dwellSvc.register({
    //   id: this.button.id,
    //   getRect: () => (this.el.nativeElement as HTMLElement).getBoundingClientRect(),
    //   dwellMs: this.dwellMs,
    //   onDwell: () => this.buttonClick.emit(this.button),
    // });
     this.dwellSvc.register({
    id: this.button.id,
    getRect: () => parent.getBoundingClientRect(),
    dwellMs: this.dwellMs,
    onDwell: () => this.buttonClick.emit(this.button),
  });
  }

  // Mouse dwell עם requestAnimationFrame (אנימציה חלקה)
  private mouseAnimFrame: number | null = null;
  private mouseDwellStart = 0;

  private startMouseDwell(): void {
    this.mouseDwellStart = performance.now();
    this.tickMouseDwell();
  }

  private tickMouseDwell(): void {
    const elapsed = performance.now() - this.mouseDwellStart;
    this.dwellProgress = Math.min(elapsed / this.dwellMs, 1);
    this.isDwelling = true;
    this.cdr.markForCheck();

    if (this.dwellProgress >= 1) {
      this.buttonClick.emit(this.button);
      this.cancelMouseDwell();
      return;
    }
    this.mouseAnimFrame = requestAnimationFrame(() => this.tickMouseDwell());
  }

  private cancelMouseDwell(): void {
    if (this.mouseAnimFrame !== null) {
      cancelAnimationFrame(this.mouseAnimFrame);
      this.mouseAnimFrame = null;
    }
    this.dwellProgress = 0;
    this.isDwelling = false;
    this.cdr.markForCheck();
  }
}