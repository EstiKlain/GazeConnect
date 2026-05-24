import {
  createActionGroup,
  emptyProps,
  props,
  createReducer,
  on,
  createFeatureSelector,
  createSelector
} from '@ngrx/store';

// Actions
export const GazeActions = createActionGroup({
  source: 'Gaze',
  events: {
    // יגיע מ-WebGazer בשלב 3.3 — כרגע מגיע מ-MouseSimulator
    /** נקודת מבט חדשה הגיעה מה-Python Eye Tracking Service */
    'Gaze Point Received': props<{ x: number; y: number; confidence: number }>(),
    /** חיבור ל-Eye Tracking Service הצליח */
    'Tracking Started': emptyProps(),

    /** חיבור ל-Eye Tracking Service נותק */
    'Tracking Stopped': emptyProps(),

    /** שגיאה בחיבור ל-Eye Tracking Service */
    'Tracking Error': props<{ error: string }>(),

    /** הפעלת/כיבוי overlay נקודת המבט (לדיבאג) */
    'Toggle Overlay': emptyProps(),
    /** נקודת מבט אבדה */
    'Gaze Lost': props<Record<string, never>>(),
  },
});

// State
export interface GazeState {
  //נקודת המבט הנוכחית על המסך
  x: number;
  y: number;
  confidence: number;
  isTracking: boolean;
  overlayVisible: boolean; // האם ה-overlay של נקודת המבט מוצג (לדיבאג)
  error: string | null;//הודעת שגיאה האחרונה
  lastUpdated: number | null;//טיימסטמפ של העדכון האחרון (לבדיקת "גיל" הנתונים)

}

const initialState: GazeState = { x: 0, y: 0, confidence: 0, isTracking: false, overlayVisible: true, error: null, lastUpdated: null };

export const gazeReducer = createReducer(
  initialState,
  on(GazeActions.gazePointReceived, (state, { x, y, confidence }) => ({
    ...state,
    x,
    y,
    confidence,
    lastUpdated: Date.now(),
    error: null,
  })),

  on(GazeActions.trackingStarted, (state) => ({
    ...state,
    isTracking: true,
    error: null,
  })),

  on(GazeActions.trackingStopped, (state) => ({
    ...state,
    isTracking: false,
  })),

  on(GazeActions.trackingError, (state, { error }) => ({
    ...state,
    isTracking: false,
    error,
  })),

  on(GazeActions.toggleOverlay, (state) => ({
    ...state,
    overlayVisible: !state.overlayVisible,
  })),

  on(GazeActions.gazeLost, (state) => ({
    ...state,
    confidence: 0,
  })),
);

// Selectors
export const selectGazeState = createFeatureSelector<GazeState>('gaze');
export const selectGazePoint = createSelector(selectGazeState, s => ({ x: s.x, y: s.y }));
export const selectGazeActive = createSelector(selectGazeState, s => s.isTracking);
export const selectGazeConfidence = createSelector(
  selectGazeState,
  (s) => s.confidence,
);

export const selectOverlayVisible = createSelector(
  selectGazeState,
  (s) => s.overlayVisible,
);

export const selectGazeError = createSelector(
  selectGazeState,
  (s) => s.error,
);





