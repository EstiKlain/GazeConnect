// ============================================================
// calibration.component.ts
//
// מיקום בפרויקט:
//   src/app/features/calibration/calibration.component.ts
// ============================================================

import {
  Component, OnInit, OnDestroy, inject, ChangeDetectorRef
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CalibrationService } from '../../../shared/services/calibration.service';
import { EyeTrackingService } from '../../../shared/services/eye-tracking.service';

// const CALIB_POINTS = [
//   { x: 10, y: 10 },   // פינה שמאלית עליונה
//   { x: 90, y: 10 },   // פינה ימנית עליונה
//   { x: 50, y: 50 },   // מרכז
//   { x: 10, y: 90 },   // פינה שמאלית תחתונה
//   { x: 90, y: 90 },   // פינה ימנית תחתונה
// ];

const CALIB_POINTS = [
  { x: 10, y: 10 }, { x: 50, y: 10 }, { x: 90, y: 10 },  // שורה עליונה
  { x: 10, y: 50 }, { x: 50, y: 50 }, { x: 90, y: 50 },  // שורה אמצעית
  { x: 10, y: 90 }, { x: 50, y: 90 }, { x: 90, y: 90 },  // שורה תחתונה
];

const SETTLE_MS = 800; // המתנה לפני איסוף — עיניים מתייצבות

@Component({
  selector: 'gc-calibration',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calibration.component.html',
  styleUrls: ['./calibration.component.scss'],
})
export class CalibrationComponent implements OnInit, OnDestroy {

  private router   = inject(Router);
  private calibSvc = inject(CalibrationService);
  private eyeSvc   = inject(EyeTrackingService);
  private cdr      = inject(ChangeDetectorRef);

  // template bindings
  readonly totalPoints     = CALIB_POINTS.length;
  currentPoint             = CALIB_POINTS[0];
  completedPoints          = 0;
  pointProgressPercent     = 0;
  isCollecting             = false;
  isDone                   = false;

  private rafId:       number | null = null;
  private settleTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.calibSvc.startSession();
    this.showPoint(0);
  }

  ngOnDestroy(): void {
    this.stopLoop();
    if (this.settleTimer) clearTimeout(this.settleTimer);
  }

  onDoneClick(): void {
    this.router.navigate(['/board']);
  }

  // ---- private flow ----

  private showPoint(index: number): void {
    if (index >= CALIB_POINTS.length) { this.finish(); return; }

    this.currentPoint        = CALIB_POINTS[index];
    this.pointProgressPercent = 0;
    this.isCollecting        = false;
    this.cdr.detectChanges();

    this.settleTimer = setTimeout(() => {
      this.isCollecting = true;
      this.startLoop(index);
    }, SETTLE_MS);
  }

  private startLoop(pointIndex: number): void {
    this.stopLoop();
    const tick = () => {
      const raw = this.eyeSvc.getRawNorm();
      if (raw) {
        const done = this.calibSvc.recordSample(raw.nx, raw.ny);
        this.pointProgressPercent =
          (this.calibSvc.currentPointProgress / this.calibSvc.samplesPerPoint) * 100;
        this.cdr.detectChanges();

        if (done) {
          this.calibSvc.finalizePoint();
          this.completedPoints = this.calibSvc.completedPoints;
          this.stopLoop();
          this.settleTimer = setTimeout(() => this.showPoint(pointIndex + 1), 300);
          return;
        }
      }
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private stopLoop(): void {
    if (this.rafId !== null) { cancelAnimationFrame(this.rafId); this.rafId = null; }
  }

  private async finish(): Promise<void> {
    await this.calibSvc.computeAndSave();
    this.isDone = true;
    this.cdr.detectChanges();
  }
}