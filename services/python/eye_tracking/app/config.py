# ──────────────────────────────────────────────────────────────────────────────
# config.py
#
# מטרה: קריאת כל הגדרות הסביבה שמשתני סביבה (environment variables).
#   Docker מעביר את הערכים דרך docker-compose.yml.
#   Pydantic-Settings מטפל בקריאה, ניתוח, וברירות מחדל.
#   instance יחיד "settings" משותף לכל הקוד — Singleton pattern.
# ──────────────────────────────────────────────────────────────────────────────

from pydantic_settings import BaseSettings


class Settings(BaseSettings):

    # --- מצלמה ---
    # אינדקס המצלמה (0 = מצלמה ראשית של המחשב)
    camera_index:  int = 0
    frame_width:   int = 640
    frame_height:  int = 480

    # --- שרת ---
    # הפורט שהשירות מאזין עליו
    port: int = 8010

    # --- Kalman Filter ---
    # process_noise: כמה אנחנו מאמינים שהמבט זז
    #   ↑ גבוה = פחות חלק, מגיב מהר יותר
    #   ↓ נמוך = יותר חלק, מגיב לאט יותר
    kalman_process_noise: float = 0.02

    # measure_noise: כמה אנחנו מאמינים למדידת MediaPipe
    #   ↑ גבוה = יותר חלק (מסתמך פחות על המדידה)
    #   ↓ נמוך = פחות חלק (מסתמך יותר על המדידה)
    kalman_measure_noise: float = 0.4

    # --- Calibration ---
    # טווח נורמלי של ה-iris שמכסה את המסך (0.0 - 1.0)
    # ניתן לכוונן לפי המצלמה והמשתמש
    calib_x_min: float = 0.2
    calib_x_max: float = 0.8
    calib_y_min: float = 0.1
    calib_y_max: float = 0.9

    class Config:
        # .env — שימוש למפתוח קוי
        env_prefix = "EYE_"
        env_file   = ".env"


# instance יחיד שכל הקוד משתש בו — Singleton pattern
settings = Settings()