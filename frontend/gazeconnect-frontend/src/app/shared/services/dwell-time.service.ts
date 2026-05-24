import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subject, Subscription } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { selectGazePoint, selectGazeActive } from '../../store/gaze/gaze.reducer';
import { DwellTarget, ActiveDwell } from '../models/dwell-target.model';
/**
 * DwellTimeService
 * ─────────────────────────────────────────────────────────────
 * מנהל את לוגיקת "שהייה" של המבט על כפתור.
 *
 * כל כפתור נרשם עם:
 *  - elementRef → ה-DOMRect שלו
 *  - dwellMs    → כמה ms לחכות (ברירת מחדל 800ms)
 *  - onDwell()  → callback כשהדוול הושלם
 *
 * זרימה:
 *  GazePoint → hitTest על כל כפתור רשום → אם אותו כפתור > dwellMs → onDwell()
 */



@Injectable({ providedIn: 'root' })
export class DwellTimeService {
  private store = inject(Store);

  /** מפיץ progress (0–1) לכל כפתור לפי ID */
  readonly dwellProgress$ = new Subject<{ id: string; progress: number }>();

  private targets = new Map<string, DwellTarget>();
  private activeDwell: ActiveDwell | null = null;
  private animFrameId: number | null = null;
  private sub!: Subscription;
  private isTrackingActive = false;

  constructor() {
    // מאזין לסטטוס ה-tracking
    this.store.select(selectGazeActive).subscribe((active) => {
      this.isTrackingActive = active;
      if (!active) this.cancelDwell();
    });

    // מאזין לנקודות הגאייז
    this.store
      .select(selectGazePoint)
      .pipe(distinctUntilChanged((a, b) => a.x === b.x && a.y === b.y))
      .subscribe(({ x, y }) => {
        if (this.isTrackingActive) {
          this.onGazePoint(x, y);
        }
      });
  }

  /** רישום כפתור למעקב */
  register(target: DwellTarget): void {
    this.targets.set(target.id, target);
  }

  /** ביטול רישום כפתור */
  unregister(id: string): void {
    this.targets.delete(id);
    if (this.activeDwell?.target.id === id) {
      this.cancelDwell();
    }
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  private onGazePoint(x: number, y: number): void {
    const hit = this.findHitTarget(x, y);
    console.log('[Dwell] x:', Math.round(x), 'y:', Math.round(y), 
              'hit:', hit?.id ?? 'none',
              'viewport:', window.innerWidth, 'x', window.innerHeight);
    
    if (!hit) {
      // מבט יצא מכל כפתור
      this.cancelDwell();
      return;
    }

    if (this.activeDwell?.target.id !== hit.id) {
      // כפתור חדש
      this.cancelDwell();
      this.startDwell(hit);
    }
    // אם אותו כפתור — ממשיכים את הטיימר הקיים
  }

  private findHitTarget(x: number, y: number): DwellTarget | null {
    for (const target of this.targets.values()) {
      const rect = target.getRect();
      if (target.id === 'c1') { // רק כפתור אחד
      console.log('[HIT TEST] gaze:', Math.round(x), Math.round(y), 
                  '| button rect:', Math.round(rect.left), Math.round(rect.top), 
                  Math.round(rect.right), Math.round(rect.bottom));
    }

      if (
        x >= rect.left &&
        x <= rect.right &&
        y >= rect.top &&
        y <= rect.bottom
      ) {
        return target;
      }
    }
    return null;
  }

  private startDwell(target: DwellTarget): void {
    this.activeDwell = { target, startedAt: performance.now(), progress: 0 };
    this.tickDwell();
  }

  private tickDwell(): void {
    if (!this.activeDwell) return;

    const elapsed = performance.now() - this.activeDwell.startedAt;
    const progress = Math.min(elapsed / this.activeDwell.target.dwellMs, 1);

    this.activeDwell.progress = progress;
    this.dwellProgress$.next({ id: this.activeDwell.target.id, progress });

    if (progress >= 1) {
      // ✅ דוול הושלם!
      this.activeDwell.target.onDwell();
      this.cancelDwell();
      return;
    }

    this.animFrameId = requestAnimationFrame(() => this.tickDwell());
  }

  private cancelDwell(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.activeDwell) {
      this.dwellProgress$.next({ id: this.activeDwell.target.id, progress: 0 });
      this.activeDwell = null;
    }
  }
}