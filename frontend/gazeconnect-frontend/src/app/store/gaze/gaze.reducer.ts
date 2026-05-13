import { createActionGroup, props, createReducer, on,
         createFeatureSelector, createSelector } from '@ngrx/store';
 
// Actions
export const GazeActions = createActionGroup({
  source: 'Gaze',
  events: {
    // יגיע מ-WebGazer בשלב 3.3 — כרגע מגיע מ-MouseSimulator
    'Gaze Point Received': props<{ x: number; y: number; confidence: number }>(),
    'Gaze Lost': props<Record<string, never>>(),
  },
});
 
// State
export interface GazeState {
  x:          number;
  y:          number;
  confidence: number;
  isActive:   boolean;
}
 
const gazeInitial: GazeState = { x: 0, y: 0, confidence: 0, isActive: false };
 
export const gazeReducer = createReducer(
  gazeInitial,
  on(GazeActions.gazePointReceived, (_, { x, y, confidence }) =>
    ({ x, y, confidence, isActive: true })),
  on(GazeActions.gazeLost, (state) =>
    ({ ...state, isActive: false })),
);
 
// Selectors
const selectGazeState = createFeatureSelector<GazeState>('gaze');
export const selectGazePoint  = createSelector(selectGazeState, s => ({ x: s.x, y: s.y }));
export const selectGazeActive = createSelector(selectGazeState, s => s.isActive);
 