import {
  ApplicationConfig,
  provideZoneChangeDetection,
  isDevMode,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideServiceWorker } from '@angular/service-worker';

import { routes } from './app.routes';
import { boardReducer } from './store/board/board.reducer';
import { gazeReducer } from './store/gaze/gaze.reducer';
import { personsReducer } from './store/persons/persons.reducer';
import { scanningReducer } from './store/scanning/scanning.reducer';
import { BoardEffects } from './store/board/board.effects';
import { PersonsEffects } from './store/persons/persons.effects';
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),

    // ── HTTP ──────────────────────────────────────────────────
    provideHttpClient(withInterceptorsFromDi()),

    // ── NgRx Store ────────────────────────────────────────────
    provideStore({
      board: boardReducer,
      gaze: gazeReducer,
      persons: personsReducer,
      scanning: scanningReducer,
    }),
    provideEffects([BoardEffects, PersonsEffects]),

    //הופך את האפליקציה עובדת גם ללא אינטרנט
    // ── PWA ───────────────────────────────────────────────────
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};