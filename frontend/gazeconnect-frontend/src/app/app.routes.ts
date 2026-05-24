import { Routes } from '@angular/router';

export const routes: Routes = [
  // ── ברירת מחדל — מפנה ללוח ───────────────────────────────
  {
    path: '',
    redirectTo: 'board',
    pathMatch: 'full',
  },

  // ── לוח AAC — lazy loaded ─────────────────────────────────
  {
    path: 'board',
    loadComponent: () =>
      import('./features/aac-board/components/board/board.component')
        .then(m => m.BoardComponent),
    title: 'לוח תקשורת — GazeConnect',
  },

  // ── מצב סריקה — overlay על הלוח ──────────────────────────
  {
    path: 'board/scan',
    loadComponent: () =>
      import('./features/aac-board/components/scanning-mode/scanning-mode.component')
        .then(m => m.ScanningModeComponent),
    title: 'מצב סריקה — GazeConnect',
  },

  // ── אנשי קשר ─────────────────────────────────────────────
  {
    path: 'contacts',
    loadComponent: () =>
      import('./features/aac-board/components/contacts/contacts.component')
        .then(m => m.ContactsComponent),
    title: 'אנשי קשר — GazeConnect',
  },

  // *** חדש: כיול אוטומטי ***
  // הקלינאית נכנסת ל-/calibration מהגדרות או מכפתור
  {
    path: 'calibration',
    loadComponent: () =>
      import('./features/calibration/calibration/calibration.component')
        .then(m => m.CalibrationComponent),
    title: 'כיול מבט — GazeConnect',
  },

  // ── fallback ──────────────────────────────────────────────
  {
    path: '**',
    redirectTo: 'board',
  },
];