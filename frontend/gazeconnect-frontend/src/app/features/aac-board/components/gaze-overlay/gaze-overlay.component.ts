
// // gaze-overlay.component.ts — נקודה אדומה שמראה מיקום המבט
// // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
// import { AsyncPipe } from '@angular/common';
// import { Store } from '@ngrx/store';
// import { selectGazePoint, selectGazeActive } from '../../../../store/gaze/gaze.reducer';
 
// @Component({
//   selector: 'gc-gaze-overlay',
//   standalone: true,
//   imports: [AsyncPipe],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   template: `
//     @if (isActive$ | async) {
//       @if (gazePoint$ | async; as pt) {
//         <div
//           class="gaze-dot"
//           [style.left.px]="pt.x"
//           [style.top.px]="pt.y"
//           aria-hidden="true"
//           role="presentation"
//         ></div>
//       }
//     }
//   `,
//   styles: [`
//     :host { position: fixed; inset: 0; pointer-events: none; z-index: 9999; }
//     .gaze-dot {
//       position: absolute;
//       width: 20px; height: 20px;
//       border-radius: 50%;
//       background: rgba(220, 38, 38, 0.85);
//       border: 2px solid white;
//       transform: translate(-50%, -50%);
//       transition: left 33ms linear, top 33ms linear;
//     }
//   `],
// })
// export class GazeOverlayComponent {
//   private store = inject(Store);
//   gazePoint$ = this.store.select(selectGazePoint);
//   isActive$  = this.store.select(selectGazeActive);
// }
 

import {
  Component,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import {
  selectGazePoint,
  selectGazeActive,
  selectOverlayVisible,
  selectGazeConfidence,
} from '../../../../store/gaze/gaze.reducer';
import { combineLatest, map } from 'rxjs';

@Component({
  selector: 'gc-gaze-overlay',
  standalone: true,
  imports: [AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './gaze-overlay.component.html',
  styleUrl: './gaze-overlay.component.scss',
})
export class GazeOverlayComponent {
  private store = inject(Store);

  vm$ = combineLatest([
    this.store.select(selectGazePoint),
    this.store.select(selectGazeActive),
    this.store.select(selectOverlayVisible),
    this.store.select(selectGazeConfidence),
  ]).pipe(
    map(([point, isActive, isVisible, confidence]) => ({
      x: point.x,
      y: point.y,
      isActive,
      isVisible,
      confidence: Math.max(0.4, confidence), // מינימום אופסיטי כדי לראות
    })),
  );
}