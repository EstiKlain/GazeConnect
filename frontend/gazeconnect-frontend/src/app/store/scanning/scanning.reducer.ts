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
    },
});

export interface ScanningState {
    isActive: boolean;
    activeIndex: number;       // אינדקס הכפתור המודגש כרגע
    intervalMs: number;       // קצב סריקה — default 1500ms מהאפיון
}

const scanningInitial: ScanningState = {
    isActive: false,
    activeIndex: -1,
    intervalMs: 1500,
};

export const scanningReducer = createReducer(
    scanningInitial,
    on(ScanningActions.scanningStarted, (state) =>
        ({ ...state, isActive: true, activeIndex: 0 })),
    on(ScanningActions.scanningStopped, () => scanningInitial),
    on(ScanningActions.nextButtonHighlighted, (state, { index }) =>
        ({ ...state, activeIndex: index })),
);

const selectScanningState = createFeatureSelector<ScanningState>('scanning');
export const selectScanningActive = createSelector(selectScanningState, s => s.isActive);
export const selectActiveIndex = createSelector(selectScanningState, s => s.activeIndex);
export const selectScanInterval = createSelector(selectScanningState, s => s.intervalMs);
