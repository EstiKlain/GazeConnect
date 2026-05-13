
// scanning-mode.component.ts — הדגשת לחצנים אחד אחד
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { Component, inject, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { Subscription, interval } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { ScanningActions, selectScanningActive, selectActiveIndex, selectScanInterval } from '../../../../store/scanning/scanning.reducer';
import { selectVisibleButtons } from '../../../../store/board/board.selectors';
import { TtsService } from '../../../../shared/services/tts.service';
 
@Component({
  selector: 'gc-scanning-mode',
  standalone: true,
  imports: [AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="scanning-indicator" aria-live="assertive" aria-atomic="true">
      @if (isActive$ | async) {
        <span>סריקה פעילה — כפתור {{ (activeIndex$ | async)! + 1 }}</span>
      }
    </div>
  `,
})
export class ScanningModeComponent implements OnInit, OnDestroy {
  private store = inject(Store);
  private tts   = inject(TtsService);
  private sub?: Subscription;
 
  isActive$    = this.store.select(selectScanningActive);
  activeIndex$ = this.store.select(selectActiveIndex);
 
  ngOnInit(): void {
    // כל intervalMs — מתקדם לכפתור הבא + AudioScanning
    this.sub = this.store.select(selectScanInterval).pipe(
      withLatestFrom(this.isActive$)
    ).subscribe(([intervalMs, isActive]) => {
      if (!isActive) return;
      this.sub?.unsubscribe();
      this.sub = interval(intervalMs).pipe(
        withLatestFrom(
          this.store.select(selectVisibleButtons),
          this.store.select(selectActiveIndex)
        )
      ).subscribe(([, buttons, currentIndex]) => {
        const nextIndex = (currentIndex + 1) % buttons.length;
        this.store.dispatch(ScanningActions.nextButtonHighlighted({ index: nextIndex }));
        // AudioScanning — קורא את שם הכפתור
        const btn = buttons[nextIndex];
        if (btn) this.tts.speakButton(btn.text, btn.ttsText);
      });
    });
  }
 
  ngOnDestroy(): void { this.sub?.unsubscribe(); }
}
 
 
// // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// // contacts.component.ts — אנשי קשר מזוהים
// // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
// import { AsyncPipe } from '@angular/common';
// import { Store } from '@ngrx/store';
// import { selectDetectedPersons } from '../../../../store/persons/persons.reducer';
// import { TtsService } from '../../../../shared/services/tts.service';
 
// @Component({
//   selector: 'gc-contacts',
//   standalone: true,
//   imports: [AsyncPipe],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   template: `
//     @if ((persons$ | async)?.length) {
//       <div class="contacts-bar" role="list" aria-label="אנשים בחדר">
//         @for (person of persons$ | async; track person.personId) {
//           <button
//             class="contact-btn"
//             role="listitem"
//             [attr.aria-label]="'דבר עם ' + person.name"
//             (click)="speakName(person.name)"
//           >
//             <span class="contact-btn__name">{{ person.name }}</span>
//           </button>
//         }
//       </div>
//     }
//   `,
//   styleUrl: './contacts.component.scss',
// })
// export class ContactsComponent {
//   private store = inject(Store);
//   private tts   = inject(TtsService);
//   persons$ = this.store.select(selectDetectedPersons);
 
//   speakName(name: string): void {
//     this.tts.speak(name);
//   }
// }
 