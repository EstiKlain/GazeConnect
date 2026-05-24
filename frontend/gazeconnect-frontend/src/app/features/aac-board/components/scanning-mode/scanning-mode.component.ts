
// // scanning-mode.component.ts — הדגשת לחצנים אחד אחד
// // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// import { Component, inject, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
// import { AsyncPipe } from '@angular/common';
// import { Store } from '@ngrx/store';
// import { Subscription, interval } from 'rxjs';
// import { switchMap, withLatestFrom } from 'rxjs/operators';
// import { ScanningActions, selectScanningActive, selectActiveIndex, selectScanInterval } from '../../../../store/scanning/scanning.reducer';
// import { selectVisibleButtons } from '../../../../store/board/board.selectors';
// import { TtsService } from '../../../../shared/services/tts.service';
// import { HostListener } from '@angular/core';

// @Component({
//   selector: 'gc-scanning-mode',
//   standalone: true,
//   imports: [AsyncPipe],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   templateUrl: './scanning-mode.component.html',
//   styleUrl:    './scanning-mode.component.scss',
// })
// export class ScanningModeComponent implements OnInit, OnDestroy {
//   private store = inject(Store);
//   private tts   = inject(TtsService);
//   private sub?: Subscription;
 
//   isActive$    = this.store.select(selectScanningActive);
//   activeIndex$ = this.store.select(selectActiveIndex);
//   scanInterval$ = this.store.select(selectScanInterval);

 
//   ngOnInit(): void {
//     // כשהסריקה פעילה – מפעיל interval לפי scanInterval
//     this.sub = this.store.select(selectScanningActive).pipe(
//       switchMap(isActive => {
//         if (!isActive) return [];
//         return this.store.select(selectScanInterval).pipe(
//           switchMap(ms =>
//             interval(ms).pipe(
//               withLatestFrom(
//                 this.store.select(selectVisibleButtons),
//                 this.store.select(selectActiveIndex),
//               )
//             )
//           )
//         );
//       })
//     ).subscribe(([, buttons, currentIndex]) => {
//       if (!buttons.length) return;
//       const nextIndex = (currentIndex + 1) % buttons.length;
//       this.store.dispatch(ScanningActions.nextButtonHighlighted({ index: nextIndex }));
 
//       // AudioScanning – קורא את שם הכפתור
//       const btn = buttons[nextIndex];
//       if (btn) this.tts.speakButton(btn.text, btn.ttsText);
//     });
//   }
 
//   ngOnDestroy(): void { this.sub?.unsubscribe(); }

//    startScanning(): void {
//     this.store.dispatch(ScanningActions.scanningStarted({}));
//   }
 
//   stopScanning(): void {
//     this.store.dispatch(ScanningActions.scanningStopped({}));
//   }

  

// }
 
 
// scanning-mode.component.ts
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// מטרה:
//   מנהל את מצב הסריקה האוטומטית — מדגיש כפתורים אחד אחד
//   בקצב קבוע, ומאפשר הפעלה דרך כל קלט חיצוני.
//
// זרימה:
//   startScanning() → interval(ms) → nextButtonHighlighted
//   → Enter/Space/ArrowRight → selectCurrent() → buttonPressed
//
// תמיכה בציוד נגישות:
//   Enter / Space    → הפעלת כפתור נוכחי  (פלט, big red button)
//   ArrowRight/Down  → כפתור הבא           (ציוד דו-כפתורי)
//   ArrowLeft/Up     → כפתור קודם          (ציוד דו-כפתורי)
//   Escape           → עצירת סריקה
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  HostListener,
} from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { Subscription, interval } from 'rxjs';
import { switchMap, withLatestFrom, take } from 'rxjs/operators';

import {
  ScanningActions,
  selectScanningActive,
  selectActiveIndex,
  selectScanInterval,
} from '../../../../store/scanning/scanning.reducer';
import { selectVisibleButtons } from '../../../../store/board/board.selectors';
import { BoardActions } from '../../../../store/board/board.actions';
import { TtsService } from '../../../../shared/services/tts.service';

const DEV_USER_ID = '00000000-0000-0000-0000-000000000001';

@Component({
  selector: 'gc-scanning-mode',
  standalone: true,
  imports: [AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './scanning-mode.component.html',
  styleUrl: './scanning-mode.component.scss',
})
export class ScanningModeComponent implements OnInit, OnDestroy {
  private store = inject(Store);
  private tts = inject(TtsService); // השירות המקורי והנכון
  private sub?: Subscription;

  // ── Observables לתבנית ────────────────────────────────────
  isActive$ = this.store.select(selectScanningActive);
  activeIndex$ = this.store.select(selectActiveIndex);
  scanInterval$ = this.store.select(selectScanInterval);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Lifecycle
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ngOnInit(): void {
    this.sub = this.store
      .select(selectScanningActive)
      .pipe(
        switchMap((isActive) => {
          if (!isActive) return [];
          return this.store.select(selectScanInterval).pipe(
            switchMap((ms) =>
              interval(ms).pipe(
                withLatestFrom(
                  this.store.select(selectVisibleButtons),
                  this.store.select(selectActiveIndex)
                )
              )
            )
          );
        })
      )
      .subscribe(([, buttons, currentIndex]) => {
        if (!buttons.length) return;
        const nextIndex = (currentIndex + 1) % buttons.length;
        this.store.dispatch(
          ScanningActions.nextButtonHighlighted({ index: nextIndex })
        );
        const btn = buttons[nextIndex];
        if (btn) this.tts.speakButton(btn.text, btn.ttsText);
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // HostListeners — קלט חיצוני (ציוד נגישות + מקלדת)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /** Enter / Space — הפעלת כפתור נוכחי (פלט, big red button) */
  @HostListener('window:keydown.enter', ['$event'])
  @HostListener('window:keydown.space', ['$event'])
  onActivate(event?: Event): void {
    event?.preventDefault(); // מונע גלילה בדפדפן ומעבר פוקוס שגוי
    
    this.store.select(selectScanningActive).pipe(take(1)).subscribe((isActive) => {
      if (!isActive) return;
      
      // תיקון: שימוש ב-tts הנכון ועצירת הדיבור של הסריקה מיד בלחיצה!
      this.tts.cancel(); 
      this.selectCurrent();
    });
  }

  /** ArrowRight / ArrowDown — כפתור הבא (ציוד דו-כפתורי) */
  @HostListener('window:keydown.arrowRight', ['$event'])
  @HostListener('window:keydown.arrowDown', ['$event'])
  onNext(event: Event): void {
    event.preventDefault();
    this.store.select(selectScanningActive).pipe(take(1)).subscribe((isActive) => {
      if (!isActive) return;
      this.advanceBy(1);
    });
  }

  /** ArrowLeft / ArrowUp — כפתור קודם (ציוד דו-כפתורי) */
  @HostListener('window:keydown.arrowLeft', ['$event'])
  @HostListener('window:keydown.arrowUp', ['$event'])
  onPrev(event: Event): void {
    event.preventDefault();
    this.store.select(selectScanningActive).pipe(take(1)).subscribe((isActive) => {
      if (!isActive) return;
      this.advanceBy(-1);
    });
  }

  /** Escape — עצירת סריקה */
  @HostListener('window:keydown.escape')
  onEscape(): void {
    this.stopScanning();
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Public API
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  startScanning(): void {
    this.store.dispatch(ScanningActions.scanningStarted({}));
  }

  stopScanning(): void {
    this.store.dispatch(ScanningActions.scanningStopped({}));
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Private
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  private selectCurrent(): void {
    this.store
      .select(selectVisibleButtons)
      .pipe(withLatestFrom(this.store.select(selectActiveIndex)), take(1))
      .subscribe(([buttons, index]) => {
        const btn = buttons[index];
        if (!btn) return;

        // שליחת הלחיצה ל-Store
        this.store.dispatch(
          BoardActions.buttonPressed({ buttonId: btn.id, userId: DEV_USER_ID })
        );
        
        // הקראת הבחירה הסופית בעוצמה
        this.tts.speakButton(btn.text, btn.ttsText);
      });
  }

  private advanceBy(delta: 1 | -1): void {
    this.store
      .select(selectVisibleButtons)
      .pipe(withLatestFrom(this.store.select(selectActiveIndex)), take(1))
      .subscribe(([buttons, currentIndex]) => {
        if (!buttons.length) return;
        
        const next = ((currentIndex + delta) % buttons.length + buttons.length) % buttons.length;
        this.store.dispatch(ScanningActions.nextButtonHighlighted({ index: next }));

        // תיקון: שימוש ב-tts הנכון
        this.tts.cancel(); 
        const btn = buttons[next];
        if (btn) this.tts.speakButton(btn.text, btn.ttsText);
      });
  }
}