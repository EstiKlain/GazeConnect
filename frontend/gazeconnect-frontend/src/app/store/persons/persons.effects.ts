// store/persons/persons.effects.ts
// 
// זרימה:
// CameraHub שולח "FaceDetected" → CameraService.faceEvents$ נורה
// → effect מקבל → מסנן (isKnown + confidence ≥ 0.5)
// → dispatch PersonsActions.personDetected({ person })
//
// למה Effect ולא ישירות ב-CameraService?
// כי NgRx Effect = מקום הנכון לתופעות לוואי אסינכרוניות.
// CameraService לא צריך לדעת על ה-store.

import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { EMPTY, timer } from 'rxjs';
import { switchMap, filter, map, withLatestFrom } from 'rxjs/operators';
import { fromEvent } from 'rxjs';

import { CameraService } from '../../features/camera/camera.service';
import { PersonsActions, selectDetectedPersons } from './persons.reducer';
import { FaceDetectionResultDto } from '../../shared/models/face-detection.model';

// סף confidence — מתחת ל-0.5 = לא מציגים (מוגדר גם בPython)
const CONFIDENCE_THRESHOLD = 0.5;

// כמה שניות בלי זיהוי חוזר → האדם "עזב"
const PERSON_TTL_MS = 5000;

@Injectable()
export class PersonsEffects {
  private cameraService = inject(CameraService);
  private store         = inject(Store);

  // ── זיהוי פנים → dispatch personDetected ─────────────────
  // faceEvents$ הוא Observable — אפשר להשתמש בו ב-effect ישירות
  faceDetected$ = createEffect(() =>
    this.cameraService.faceEvents$.pipe(
      // רק פנים מוכרות מעל סף
      filter((r: FaceDetectionResultDto) =>
        r.isKnown &&
        r.confidence >= CONFIDENCE_THRESHOLD &&
        r.personId !== null
      ),
      map((r: FaceDetectionResultDto) => PersonsActions.personDetected({
        person: {
          personId:   r.personId!,
          name:       r.personName ?? 'אורח',
          confidence: r.confidence,
          detectedAt: r.timestampMs,
        }
      }))
    )
  );

  // ── אדם לא ידוע → dispatch עם שם "מי זה?" ────────────────
  unknownFace$ = createEffect(() =>
    this.cameraService.faceEvents$.pipe(
      filter((r: FaceDetectionResultDto) =>
        !r.isKnown && r.confidence >= CONFIDENCE_THRESHOLD
      ),
      map(() => PersonsActions.personDetected({
        person: {
          personId:   'unknown-' + Date.now(),
          name:       'מי זה? 🤔',
          confidence: 0,
          detectedAt: Date.now(),
        }
      }))
    )
  );
}