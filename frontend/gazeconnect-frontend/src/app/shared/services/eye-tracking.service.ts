// import { Injectable, OnDestroy, inject } from '@angular/core';
// import { Store } from '@ngrx/store';
// import { GazeActions } from '../../store/gaze/gaze.reducer';
// import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

// @Injectable({ providedIn: 'root' })
// export class EyeTrackingService implements OnDestroy {
//   private store   = inject(Store);
//   private lander: FaceLandmarker | null = null;
//   private video:  HTMLVideoElement | null = null;
//   private rafId:  number | null = null;
//   private running = false;

//   // calibration — זהה לערכי ברירת המחדל ב-Python
//   private readonly C = { xMin: 0.2, xMax: 0.8, yMin: 0.1, yMax: 0.9 };

//   // Iris landmark indices — זהים ל-Python gaze_estimator.py
//   private readonly LI = 473; private readonly RI = 468;
//   private readonly LIN = 133; private readonly LO = 33;
//   private readonly RIN = 362; private readonly RO = 263;
//   private readonly LT = 159;  private readonly LB = 145;
//   private readonly RT = 386;  private readonly RB = 374;

//   async start(): Promise<void> {
//     if (this.running) return;
//     this.running = true;

//     try {
//       const vision = await FilesetResolver.forVisionTasks(
//         'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
//       );
//       this.lander = await FaceLandmarker.createFromOptions(vision, {
//         baseOptions: {
//           modelAssetPath:
//             'https://storage.googleapis.com/mediapipe-models/' +
//             'face_landmarker/face_landmarker/float16/1/face_landmarker.task',
//           delegate: 'GPU',
//         },
//         runningMode: 'VIDEO',
//         numFaces: 1,
//       });

//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: { width: 640, height: 480, facingMode: 'user' },
//       });
//       this.video = document.createElement('video');
//       this.video.srcObject = stream;
//       this.video.playsInline = true;
//       await this.video.play();

//       this.store.dispatch(GazeActions.trackingStarted());
//       this.loop();

//     } catch (err) {
//       const msg = err instanceof Error ? err.message : String(err);
//       this.store.dispatch(GazeActions.trackingError({ error: msg }));
//       this.running = false;
//     }
//   }

//   stop(): void {
//     this.running = false;
//     if (this.rafId) cancelAnimationFrame(this.rafId);
//     (this.video?.srcObject as MediaStream | null)
//       ?.getTracks().forEach(t => t.stop());
//     this.video = null;
//     this.store.dispatch(GazeActions.trackingStopped());
//   }

//   ngOnDestroy(): void { this.stop(); }

//   private loop(): void {
//     if (!this.running || !this.lander || !this.video) return;
//     const results = this.lander.detectForVideo(this.video, performance.now());
//     const lm = results.faceLandmarks?.[0];
//     if (lm) {
//       const gaze = this.computeGaze(lm);
//       if (gaze) {
//         this.store.dispatch(GazeActions.gazePointReceived({
//           x: gaze.x, y: gaze.y, confidence: gaze.confidence,
//         }));
//       }
//     }
//     this.rafId = requestAnimationFrame(() => this.loop());
//   }

//   private computeGaze(
//     lm: { x: number; y: number }[]
//   ): { x: number; y: number; confidence: number } | null {
//     const d = (a: {x:number,y:number}, b: {x:number,y:number}) =>
//       Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

//     const leftEyeW  = d(lm[this.LIN], lm[this.LO]);
//     const rightEyeW = d(lm[this.RIN], lm[this.RO]);
//     if (leftEyeW < 0.005 || rightEyeW < 0.005) return null;

//     const lc = { x: (lm[this.LIN].x + lm[this.LO].x) / 2,
//                  y: (lm[this.LIN].y + lm[this.LO].y) / 2 };
//     const rc = { x: (lm[this.RIN].x + lm[this.RO].x) / 2,
//                  y: (lm[this.RIN].y + lm[this.RO].y) / 2 };

//     const avgX = ((lm[this.LI].x - lc.x) / (leftEyeW  / 2) +
//                   (lm[this.RI].x - rc.x) / (rightEyeW / 2)) / 2;
//     const avgY = ((lm[this.LI].y - lc.y) / (leftEyeW  / 2) +
//                   (lm[this.RI].y - rc.y) / (rightEyeW / 2)) / 2;

//     const confidence = Math.min(1,
//       ((d(lm[this.LT], lm[this.LB]) + d(lm[this.RT], lm[this.RB])) / 2) / 0.02
//     );
//     if (confidence < 0.15) return null;

//     let nx = (-avgX * 0.5 + 0.5);
//     let ny = ( avgY * 0.5 + 0.5);
//     nx = (nx - this.C.xMin) / (this.C.xMax - this.C.xMin);
//     ny = (ny - this.C.yMin) / (this.C.yMax - this.C.yMin);

//     return {
//       x: Math.max(0, Math.min(window.innerWidth,  nx * window.innerWidth)),
//       y: Math.max(0, Math.min(window.innerHeight, ny * window.innerHeight)),
//       confidence,
//     };
//   }
// }
// ============================================================
// eye-tracking.service.ts  (גרסה מעודכנת)
//
// מיקום בפרויקט:
//   src/app/shared/services/eye-tracking.service.ts
//
// שינויים מהגרסה הקודמת:
//   - הסרנו את this.C הקבוע { xMin: 0.2, xMax: 0.8, ... }
//   - במקומו: קוראים ל-CalibrationService.getCalibration()
//   - computeGaze קיבל פרמטר calib במקום הערכים הקשיחים
//   - הוספנו getRawNorm() — מחזיר את ה-nx,ny לפני המרה,
//     כדי ש-CalibrationComponent יוכל לקלוט דגימות
// ============================================================

import { Injectable, OnDestroy, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { GazeActions } from '../../store/gaze/gaze.reducer';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { CalibrationService } from './calibration.service';

@Injectable({ providedIn: 'root' })
export class EyeTrackingService implements OnDestroy {
  private store = inject(Store);
  private calib = inject(CalibrationService);

  private lander: FaceLandmarker | null = null;
  private video: HTMLVideoElement | null = null;
  private rafId: number | null = null;
  private running = false;

  // Iris landmark indices — זהים ל-Python gaze_estimator.py
  private readonly LI = 473; private readonly RI = 468;
  private readonly LIN = 133; private readonly LO = 33;
  private readonly RIN = 362; private readonly RO = 263;
  private readonly LT = 159; private readonly LB = 145;
  private readonly RT = 386; private readonly RB = 374;

  // ============================================================
  // Public API
  // ============================================================

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;

    try {
      const vision = await FilesetResolver.forVisionTasks(
        //  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        '/assets/mediapipe/wasm'
      );
      this.lander = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            // 'https://storage.googleapis.com/mediapipe-models/' +
            // 'face_landmarker/face_landmarker/float16/1/face_landmarker.task',
             '/assets/mediapipe/models/face_landmarker.task',
          delegate: 'CPU',
        },
        runningMode: 'VIDEO',
        numFaces: 1,
      });

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      this.video = document.createElement('video');
      this.video.srcObject = stream;
      this.video.playsInline = true;
      await this.video.play();

      this.store.dispatch(GazeActions.trackingStarted());
      this.loop();

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.store.dispatch(GazeActions.trackingError({ error: msg }));
      this.running = false;
    }
  }

  stop(): void {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    (this.video?.srcObject as MediaStream | null)
      ?.getTracks().forEach(t => t.stop());
    this.video = null;
    this.store.dispatch(GazeActions.trackingStopped());
  }

  ngOnDestroy(): void { this.stop(); }

  /**
   * מחזיר את ה-nx, ny הגולמיים (לפני המרה לפיקסלים).
   * משמש את CalibrationComponent לאיסוף דגימות.
   * מחזיר null אם אין פנים בפריים.
   */
  getRawNorm(): { nx: number; ny: number } | null {
    if (!this.lander || !this.video) return null;
    const results = this.lander.detectForVideo(this.video, performance.now());
    const lm = results.faceLandmarks?.[0];
    if (!lm) return null;
    return this.computeRawNorm(lm);
  }

  // ============================================================
  // Private
  // ============================================================

  private loop(): void {
    if (!this.running || !this.lander || !this.video) return;

    const results = this.lander.detectForVideo(this.video, performance.now());
    const lm = results.faceLandmarks?.[0];

    if (lm) {
      // קוראים את נתוני הכיול בכל frame — כך כל שינוי מיידי
      const calibData = this.calib.getCalibration();
      const gaze = this.computeGaze(lm, calibData);
      if (gaze) {
        this.store.dispatch(GazeActions.gazePointReceived({
          x: gaze.x, y: gaze.y, confidence: gaze.confidence,
        }));
      }
    }

    this.rafId = requestAnimationFrame(() => this.loop());
  }

  /** מחשב nx, ny גולמיים לפני mapping לכיול */
  private computeRawNorm(
    lm: { x: number; y: number }[]
  ): { nx: number; ny: number } | null {
    const d = (a: { x: number, y: number }, b: { x: number, y: number }) =>
      Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

    const leftEyeW = d(lm[this.LIN], lm[this.LO]);
    const rightEyeW = d(lm[this.RIN], lm[this.RO]);
    if (leftEyeW < 0.005 || rightEyeW < 0.005) return null;

    const lc = {
      x: (lm[this.LIN].x + lm[this.LO].x) / 2,
      y: (lm[this.LIN].y + lm[this.LO].y) / 2
    };
    const rc = {
      x: (lm[this.RIN].x + lm[this.RO].x) / 2,
      y: (lm[this.RIN].y + lm[this.RO].y) / 2
    };

    const avgX = ((lm[this.LI].x - lc.x) / (leftEyeW / 2) +
      (lm[this.RI].x - rc.x) / (rightEyeW / 2)) / 2;
    const avgY = ((lm[this.LI].y - lc.y) / (leftEyeW / 2) +
      (lm[this.RI].y - rc.y) / (rightEyeW / 2)) / 2;

    const confidence = Math.min(1,
      ((d(lm[this.LT], lm[this.LB]) + d(lm[this.RT], lm[this.RB])) / 2) / 0.02
    );
    if (confidence < 0.15) return null;

    // כיוון X: מצלמה היא mirror
    const nx = (-avgX * 0.5 + 0.5);
    const ny = (avgY * 0.5 + 0.5);

    return { nx, ny };
  }

  /** מחשב gaze מלא עם נתוני כיול */
  private computeGaze(
    lm: { x: number; y: number }[],
    c: { xMin: number; xMax: number; yMin: number; yMax: number }
  ): { x: number; y: number; confidence: number } | null {
    const d = (a: { x: number, y: number }, b: { x: number, y: number }) =>
      Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

    const raw = this.computeRawNorm(lm);
    if (!raw) return null;

    const confidence = Math.min(1,
      ((d(lm[this.LT], lm[this.LB]) + d(lm[this.RT], lm[this.RB])) / 2) / 0.02
    );

    // mapping לפי כיול
    let nx = (raw.nx - c.xMin) / (c.xMax - c.xMin);
    let ny = (raw.ny - c.yMin) / (c.yMax - c.yMin);

    return {
      x: Math.max(0, Math.min(window.innerWidth, nx * window.innerWidth)),
      y: Math.max(0, Math.min(window.innerHeight, ny * window.innerHeight)),
      confidence,
    };
  }
}