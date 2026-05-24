# ──────────────────────────────────────────────────────────────────────────────
# kalman_filter.py
#
# מטרה: החלקת נקודות מבט גולמיות מ-MediaPipe.
#
# הבעיה: עיניים רועדות תמיד (Nystagmus, רעידות טבעיות, רעש מצלמה).
#   בלי פילטר: נקודת המבט קופצת ±50px בכל frame → DwellTime לא עובד.
#   עם פילטר:  נקודה יציבה ומדויקת → DwellTime עובד מצוין.
#
# מודל: state = [x, y, vx, vy] — מיקום + מהירות
#        obs   = [x, y]         — מה שMediaPipe מדד
# ──────────────────────────────────────────────────────────────────────────────

from __future__ import annotations

import numpy as np


class GazeKalmanFilter:
    """
    Kalman Filter דו-ממדי לנקודת מבט.

    פרמטרים:
        process_noise  — כמה אנחנו מאמינים שהמבט זז
                         ↑ גבוה = פחות חלק, מגיב מהר
                         ↓ נמוך = יותר חלק, מגיב לאט
        measure_noise  — כמה אנחנו מאמינים למדידה
                         ↑ גבוה = יותר חלק (מתעלם מהמדידה)
                         ↓ נמוך = פחות חלק (מאמין למדידה)
    """

    def __init__(
        self,
        process_noise: float = 0.02,
        measure_noise: float = 0.4,
    ) -> None:
        # ── מטריצת מעבר (קינמטיקה: x += vx*dt, y += vy*dt, dt=1) ───────────
        self.F = np.array([
            [1, 0, 1, 0],
            [0, 1, 0, 1],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
        ], dtype=float)

        # ── מטריצת מדידה (רואים רק x, y — לא vx, vy) ────────────────────────
        self.H = np.array([
            [1, 0, 0, 0],
            [0, 1, 0, 0],
        ], dtype=float)

        # ── רעש תהליך (Q) ────────────────────────────────────────────────────
        q = process_noise
        self.Q = np.diag([q, q, q, q])

        # ── רעש מדידה (R) ────────────────────────────────────────────────────
        r = measure_noise
        self.R = np.diag([r, r])

        # ── מצב התחלתי ────────────────────────────────────────────────────────
        self.x = np.zeros((4, 1), dtype=float)    # [x, y, vx, vy]
        self.P = np.eye(4, dtype=float) * 100.0   # אי-וודאות גבוהה בהתחלה
        self._initialized = False

    def update(self, measured_x: float, measured_y: float) -> tuple[float, float]:
        """
        מקבל מדידה גולמית ומחזיר מיקום מוחלק.

        Args:
            measured_x: מיקום X ממדיה-פייפ (פיקסלים מסך)
            measured_y: מיקום Y ממדיה-פייפ (פיקסלים מסך)

        Returns:
            tuple (smooth_x, smooth_y)
        """
        z = np.array([[measured_x], [measured_y]], dtype=float)

        if not self._initialized:
            self.x = np.array([[measured_x], [measured_y], [0.0], [0.0]])
            self._initialized = True
            return measured_x, measured_y

        # ── Predict ──────────────────────────────────────────────────────────
        x_pred = self.F @ self.x
        P_pred = self.F @ self.P @ self.F.T + self.Q

        # ── Update ───────────────────────────────────────────────────────────
        y_innov = z - self.H @ x_pred
        S       = self.H @ P_pred @ self.H.T + self.R
        K       = P_pred @ self.H.T @ np.linalg.inv(S)  # Kalman gain

        self.x = x_pred + K @ y_innov
        self.P = (np.eye(4) - K @ self.H) @ P_pred

        return float(self.x[0, 0]), float(self.x[1, 0])

    def reset(self) -> None:
        """איפוס הפילטר — קורה כשאין פנים בפריים."""
        self.x = np.zeros((4, 1), dtype=float)
        self.P = np.eye(4, dtype=float) * 100.0
        self._initialized = False