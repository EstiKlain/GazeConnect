import {
    createActionGroup, props, createReducer, on,
    createFeatureSelector, createSelector
} from '@ngrx/store';
export const ScanningActions = createActionGroup({
    source: 'Scanning',
    events: {
        'Scanning Started': props<Record<string, never>>(),
        'Scanning Stopped': props<Record<string, never>>(),
        'Next Button Highlighted': props<{ index: number }>(),
        'Active Button Selected': props<Record<string, never>>(),
        'Dwell Ms Changed':        props<{ dwellMs: number }>(),
        'Scan Interval Changed':   props<{ intervalMs: number }>(),
    },
});

export interface ScanningState {
    isActive: boolean;
    activeIndex: number;       // אינדקס הכפתור המודגש כרגע
    intervalMs: number;       // קצב סריקה — default 1500ms מהאפיון
    dwellMs: number;          // משך dwell — default 900ms מהאפיון
}

const scanningInitial: ScanningState = {
    isActive: false,
    activeIndex: -1,
    intervalMs: 1500,
    dwellMs: 900,
};

export const scanningReducer = createReducer(
    scanningInitial,
    on(ScanningActions.scanningStarted, (state) =>
        ({ ...state, isActive: true, activeIndex: 0 })),
    on(ScanningActions.scanningStopped, () => scanningInitial),
    on(ScanningActions.nextButtonHighlighted, (state, { index }) =>
        ({ ...state, activeIndex: index })),
    on(ScanningActions.dwellMsChanged, (state, { dwellMs }) =>
        ({ ...state, dwellMs })),
    on(ScanningActions.scanIntervalChanged, (state, { intervalMs }) =>
        ({ ...state, intervalMs })),
);

const selectScanningState = createFeatureSelector<ScanningState>('scanning');
export const selectScanningActive = createSelector(selectScanningState, s => s.isActive);
export const selectActiveIndex = createSelector(selectScanningState, s => s.activeIndex);
export const selectScanInterval = createSelector(selectScanningState, s => s.intervalMs);
export const selectDwellMs        = createSelector(selectScanningState, s => s.dwellMs);
