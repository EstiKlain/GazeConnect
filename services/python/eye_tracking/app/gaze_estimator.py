# ──────────────────────────────────────────────────────────────────────────────
# gaze_estimator.py
#
# מטרה: פותח את המצלמה, מריץ MediaPipe Face Mesh בthread נפרד,
#   מחשב את נקודת המבט על המסך, ומחליק עם Kalman Filter.
#
# thread-safe: get_latest_gaze() בטוח לקרוא מכל thread.
#
# אלגוריתם:
#   1. קריאת frame מהמצלמה (OpenCV)
#   2. MediaPipe → 478 נקודות פנים כולל iris landmarks
#   3. חישוב מיקום האישון ביחס לעין → כיוון מבט מנורמל [-1, 1]
#   4. המרה לפיקסלים על המסך דרך calibration
#   5. Kalman Filter → נקודה יציבה ומחולקת
# ──────────────────────────────────────────────────────────────────────────────

from __future__ import annotations

import logging
import threading
import time
from typing import Dict, Optional

import cv2
import mediapipe as mp
import numpy as np

from app.kalman_filter import GazeKalmanFilter
from app.config import settings

logger = logging.getLogger(__name__)

# ── MediaPipe iris landmarks (מתוך 478 נקודות) ───────────────────────────────
# מרכז האישון — הנקודות החשובות ביותר עבורנו
LEFT_IRIS_CENTER  = 473   # עין שמאלית (מנקודת מבט המצלמה)
RIGHT_IRIS_CENTER = 468   # עין ימנית

# פינות עיניים — לנרמול מיקום האישון בתוך העין
LEFT_EYE_INNER  = 133
LEFT_EYE_OUTER  = 33
RIGHT_EYE_INNER = 362
RIGHT_EYE_OUTER = 263

# עפעפיים — לחישוב כמה העין פתוחה (confidence)
LEFT_EYE_TOP     = 159
LEFT_EYE_BOTTOM  = 145
RIGHT_EYE_TOP    = 386
RIGHT_EYE_BOTTOM = 374


class GazeEstimator:
    """
    מריץ MediaPipe Face Mesh בthread נפרד.
    מספק gaze point מעודכן ל-main thread דרך get_latest_gaze().
    """

    def __init__(
        self,
        camera_index:  int   = 0,
        frame_width:   int   = 640,
        frame_height:  int   = 480,
        process_noise: float = 0.02,
        measure_noise: float = 0.4,
    ) -> None:
        self._camera_index  = camera_index
        self._frame_width   = frame_width
        self._frame_height  = frame_height

        # thread safety
        self._lock   = threading.Lock()
        self._latest: Optional[Dict] = None
        self._running = False
        self._thread: Optional[threading.Thread] = None

        # Kalman Filter להחלקת רעש עיניים
        self._kalman = GazeKalmanFilter(
            process_noise=process_noise,
            measure_noise=measure_noise,
        )

        # גודל מסך — ברירת מחדל FullHD
        # ניתן לעדכן מהלקוח בעתיד
        self._screen_w = 1920
        self._screen_h = 1080

    # ── Public API ────────────────────────────────────────────────────────────

    @property
    def is_running(self) -> bool:
        return self._running

    def start(self) -> None:
        """מתחיל את thread המצלמה."""
        self._running = True
        self._thread  = threading.Thread(
            target=self._run_loop,
            daemon=True,
            name="GazeEstimator",
        )
        self._thread.start()
        logger.info("GazeEstimator started (camera %d)", self._camera_index)

    def stop(self) -> None:
        """עוצר את thread המצלמה ומשחרר משאבים."""
        self._running = False
        if self._thread:
            self._thread.join(timeout=3.0)
        logger.info("GazeEstimator stopped")

    def get_latest_gaze(self) -> Optional[Dict]:
        """
        מחזיר את נקודת המבט האחרונה.
        Thread-safe — בטוח לקרוא מה-broadcast loop.

        Returns:
            {"x": float, "y": float, "confidence": float} או None אם אין פנים
        """
        with self._lock:
            return self._latest

    def set_screen_size(self, width: int, height: int) -> None:
        """עדכון גודל מסך (יכול להגיע מה-Angular בעתיד)."""
        self._screen_w = width
        self._screen_h = height
        logger.info("Screen size updated: %dx%d", width, height)

    # ── Main Loop (רץ ב-thread נפרד) ─────────────────────────────────────────

    def _run_loop(self) -> None:
        mp_face_mesh = mp.solutions.face_mesh

        # פתיחת מצלמה
        cap = cv2.VideoCapture(self._camera_index)
        cap.set(cv2.CAP_PROP_FRAME_WIDTH,  self._frame_width)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self._frame_height)
        cap.set(cv2.CAP_PROP_FPS, 30)

        if not cap.isOpened():
            logger.error("Cannot open camera %d", self._camera_index)
            self._running = False
            return

        logger.info("Camera opened successfully")

        # הפעלת MediaPipe Face Mesh
        # refine_landmarks=True → מפעיל iris landmarks (חובה!)
        with mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        ) as face_mesh:

            while self._running:
                ret, frame = cap.read()
                if not ret:
                    logger.warning("Frame capture failed — retrying...")
                    time.sleep(0.1)
                    continue

                # MediaPipe דורש RGB (OpenCV נותן BGR)
                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                rgb.flags.writeable = False  # אופטימיזציה

                results = face_mesh.process(rgb)

                if results.multi_face_landmarks:
                    lm    = results.multi_face_landmarks[0].landmark
                    gaze  = self._compute_gaze(lm, frame.shape)

                    if gaze:
                        # Kalman smoothing — מחליק את הרעש
                        sx, sy = self._kalman.update(gaze["raw_x"], gaze["raw_y"])
                        with self._lock:
                            self._latest = {
                                "x":          sx,
                                "y":          sy,
                                "confidence": gaze["confidence"],
                            }
                else:
                    # אין פנים בפריים — מאפס Kalman ומנקה
                    self._kalman.reset()
                    with self._lock:
                        self._latest = None

        cap.release()
        logger.info("Camera released")

    # ── Gaze Computation ──────────────────────────────────────────────────────

    def _compute_gaze(
        self,
        lm:          list,
        frame_shape: tuple,
    ) -> Optional[Dict]:
        """
        מחשב נקודת מבט מ-landmarks של MediaPipe.

        שלבים:
          1. מיקום אישון (ממוצע שתי עיניים)
          2. נרמול ביחס לרוחב העין → [-1, 1]
          3. ממוצע שתי עיניים
          4. המרה לפיקסלים מסך

        Returns:
            {"raw_x": float, "raw_y": float, "confidence": float} או None
        """
        h, w = frame_shape[:2]

        def to_px(idx: int) -> np.ndarray:
            return np.array([lm[idx].x * w, lm[idx].y * h])

        # ── מיקום אישון ────────────────────────────────────────────────────
        left_iris  = to_px(LEFT_IRIS_CENTER)
        right_iris = to_px(RIGHT_IRIS_CENTER)

        # ── פינות עיניים לנרמול ─────────────────────────────────────────────
        left_inner  = to_px(LEFT_EYE_INNER)
        left_outer  = to_px(LEFT_EYE_OUTER)
        right_inner = to_px(RIGHT_EYE_INNER)
        right_outer = to_px(RIGHT_EYE_OUTER)

        left_eye_w  = np.linalg.norm(left_inner  - left_outer)
        right_eye_w = np.linalg.norm(right_inner - right_outer)

        if left_eye_w < 1 or right_eye_w < 1:
            return None  # עין מחוץ לפריים

        # ── iris position מנורמל [-1, 1] בתוך העין ──────────────────────────
        left_center  = (left_inner  + left_outer)  / 2
        right_center = (right_inner + right_outer) / 2

        left_norm  = (left_iris  - left_center)  / (left_eye_w  / 2)
        right_norm = (right_iris - right_center) / (right_eye_w / 2)

        avg_norm = (left_norm + right_norm) / 2

        # ── confidence = כמה העין פתוחה ─────────────────────────────────────
        left_open  = np.linalg.norm(to_px(LEFT_EYE_TOP)  - to_px(LEFT_EYE_BOTTOM))
        right_open = np.linalg.norm(to_px(RIGHT_EYE_TOP) - to_px(RIGHT_EYE_BOTTOM))
        avg_open   = (left_open + right_open) / 2

        # 12px = עין פתוחה לגמרי. פחות מ-15% = עין עצומה
        confidence = float(np.clip(avg_open / 12.0, 0.0, 1.0))
        if confidence < 0.15:
            return None

        # ── המרה לפיקסלים מסך ───────────────────────────────────────────────
        # הפוך X — המצלמה היא mirror
        norm_x = (-avg_norm[0] * 0.5 + 0.5)  # [0, 1], 0.5 = מרכז
        norm_y = ( avg_norm[1] * 0.5 + 0.5)

        # stretch לפי calibration מ-config
        cx_min, cx_max = settings.calib_x_min, settings.calib_x_max
        cy_min, cy_max = settings.calib_y_min, settings.calib_y_max

        norm_x = (norm_x - cx_min) / (cx_max - cx_min)
        norm_y = (norm_y - cy_min) / (cy_max - cy_min)

        screen_x = float(np.clip(norm_x * self._screen_w, 0, self._screen_w))
        screen_y = float(np.clip(norm_y * self._screen_h, 0, self._screen_h))

        return {
            "raw_x":      screen_x,
            "raw_y":      screen_y,
            "confidence": confidence,
        }