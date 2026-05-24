// ============================================================
// calibration.service.ts
//
// מיקום בפרויקט:
//   src/app/shared/services/calibration.service.ts
//
// ה-interface עצמו נמצא ב: shared/models/CalibrationData.model.ts
// ============================================================

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CalibrationData, DEFAULT_CALIBRATION } from '../models/CalibrationData.model';

const DEV_USER_ID     = '00000000-0000-0000-0000-000000000001'; // TODO שלב 4: JWT
const LOCAL_CACHE_KEY = 'gazeconnect_calib_cache';
const SAMPLES_PER_POINT = 30; // ~1 שניה ב-30fps

@Injectable({ providedIn: 'root' })
export class CalibrationService {

  private http = inject(HttpClient);

  private samples:       { x: number; y: number }[] = [];
  private pointAverages: { x: number; y: number }[] = [];
  private cachedCalib:   CalibrationData = { ...DEFAULT_CALIBRATION };

  // ----------------------------------------------------------------
  // טעינה מהשרת — קרא פעם אחת ב-AppComponent.ngOnInit
  // ----------------------------------------------------------------
  async loadFromServer(): Promise<void> {
    try {
      // GET http://localhost:5004/users/{id}/settings
      const url  = `${environment.apiUrls.userProfile}/users/${DEV_USER_ID}/settings`;
      const data = await firstValueFrom(
        this.http.get<{ calibration?: CalibrationData }>(url)
      );
      if (data?.calibration) {
        this.cachedCalib = data.calibration;
        localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(data.calibration));
      } else {
        this.loadFromLocalCache();
      }
    } catch {
      // שרת לא זמין — נשתמש ב-cache מקומי
      this.loadFromLocalCache();
    }
  }

  // ----------------------------------------------------------------
  // Public API — נקרא מ-EyeTrackingService בכל frame
  // ----------------------------------------------------------------

  /** סינכרוני ומהיר — חייב! */
  getCalibration(): CalibrationData { return this.cachedCalib; }

  startSession(): void {
    this.samples = [];
    this.pointAverages = [];
  }

  /** @returns true כשנאספו מספיק דגימות לנקודה הנוכחית */
  recordSample(nx: number, ny: number): boolean {
    this.samples.push({ x: nx, y: ny });
    return this.samples.length >= SAMPLES_PER_POINT;
  }

  finalizePoint(): void {
    if (!this.samples.length) return;
    const avgX = this.samples.reduce((s, p) => s + p.x, 0) / this.samples.length;
    const avgY = this.samples.reduce((s, p) => s + p.y, 0) / this.samples.length;
    this.pointAverages.push({ x: avgX, y: avgY });
    this.samples = [];
  }

  get completedPoints():     number { return this.pointAverages.length; }
  get currentPointProgress(): number { return Math.min(this.samples.length, SAMPLES_PER_POINT); }
  get samplesPerPoint():     number { return SAMPLES_PER_POINT; }

  /** מחשב, שומר cache + localStorage + שרת */
  async computeAndSave(): Promise<CalibrationData> {
    if (this.pointAverages.length < 2) return { ...DEFAULT_CALIBRATION };

    const xs = this.pointAverages.map(p => p.x);
    const ys = this.pointAverages.map(p => p.y);
    const m  = 0.02; // margin

    const calib: CalibrationData = {
      xMin: Math.max(0, Math.min(...xs) - m),
      xMax: Math.min(1, Math.max(...xs) + m),
      yMin: Math.max(0, Math.min(...ys) - m),
      yMax: Math.min(1, Math.max(...ys) + m),
      calibratedAt: Date.now(),
    };

    this.cachedCalib = calib;                                          // 1. cache מיידי
    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(calib));     // 2. localStorage
    this.saveToServer(calib);                                          // 3. שרת async

    return calib;
  }

  // ----------------------------------------------------------------
  // Private
  // ----------------------------------------------------------------

  private loadFromLocalCache(): void {
    const s = localStorage.getItem(LOCAL_CACHE_KEY);
    if (!s) return;
    try { this.cachedCalib = JSON.parse(s); } catch { /* */ }
  }

  private async saveToServer(calib: CalibrationData): Promise<void> {
    try {
      // PATCH http://localhost:5004/users/{id}/settings
      const url = `${environment.apiUrls.userProfile}/users/${DEV_USER_ID}/settings`;
      await firstValueFrom(this.http.patch(url, { calibration: calib }));
    } catch (err) {
      console.warn('[Calibration] Server save failed (data safe in localStorage):', err);
    }
  }
}