import { createActionGroup, props, createReducer, on,
         createFeatureSelector, createSelector } from '@ngrx/store';

export interface DetectedPerson {
  personId:   string;
  name:       string;
  confidence: number;
  detectedAt: number;   // timestamp
}
 
export const PersonsActions = createActionGroup({
  source: 'Persons',
  events: {
    // יגיע מ-SignalR של CameraHub בשלב מאוחר יותר
    'Person Detected': props<{ person: DetectedPerson }>(),
    'Person Left':     props<{ personId: string }>(),
    'Persons Cleared': props<Record<string, never>>(),
  },
});
 
export interface PersonsState {
  persons: DetectedPerson[];
}
 
const personsInitial: PersonsState = { persons: [] };
 
export const personsReducer = createReducer(
  personsInitial,
  on(PersonsActions.personDetected, (state, { person }) => ({
    persons: [
      ...state.persons.filter(p => p.personId !== person.personId),
      person,
    ],
  })),
  on(PersonsActions.personLeft, (state, { personId }) => ({
    persons: state.persons.filter(p => p.personId !== personId),
  })),
  on(PersonsActions.personsCleared, () => personsInitial),
);
 
const selectPersonsState = createFeatureSelector<PersonsState>('persons');
export const selectDetectedPersons = createSelector(selectPersonsState, s => s.persons);
 