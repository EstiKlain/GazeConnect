
// scanning-mode.component.ts — הדגשת לחצנים אחד אחד
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { Component, inject, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { Subscription, interval } from 'rxjs';
import { switchMap, withLatestFrom } from 'rxjs/operators';
import { ScanningActions, selectScanningActive, selectActiveIndex, selectScanInterval } from '../../../../store/scanning/scanning.reducer';
import { selectVisibleButtons } from '../../../../store/board/board.selectors';
import { TtsService } from '../../../../shared/services/tts.service';

@Component({
  selector: 'gc-scanning-mode',
  standalone: true,
  imports: [AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './scanning-mode.component.html',
  styleUrl:    './scanning-mode.component.scss',
})
export class ScanningModeComponent implements OnInit, OnDestroy {
  private store = inject(Store);
  private tts   = inject(TtsService);
  private sub?: Subscription;
 
  isActive$    = this.store.select(selectScanningActive);
  activeIndex$ = this.store.select(selectActiveIndex);
  scanInterval$ = this.store.select(selectScanInterval);

 
  ngOnInit(): void {
    // כשהסריקה פעילה – מפעיל interval לפי scanInterval
    this.sub = this.store.select(selectScanningActive).pipe(
      switchMap(isActive => {
        if (!isActive) return [];
        return this.store.select(selectScanInterval).pipe(
          switchMap(ms =>
            interval(ms).pipe(
              withLatestFrom(
                this.store.select(selectVisibleButtons),
                this.store.select(selectActiveIndex),
              )
            )
          )
        );
      })
    ).subscribe(([, buttons, currentIndex]) => {
      if (!buttons.length) return;
      const nextIndex = (currentIndex + 1) % buttons.length;
      this.store.dispatch(ScanningActions.nextButtonHighlighted({ index: nextIndex }));
 
      // AudioScanning – קורא את שם הכפתור
      const btn = buttons[nextIndex];
      if (btn) this.tts.speakButton(btn.text, btn.ttsText);
    });
  }
 
  ngOnDestroy(): void { this.sub?.unsubscribe(); }

   startScanning(): void {
    this.store.dispatch(ScanningActions.scanningStarted({}));
  }
 
  stopScanning(): void {
    this.store.dispatch(ScanningActions.scanningStopped({}));
  }

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
 