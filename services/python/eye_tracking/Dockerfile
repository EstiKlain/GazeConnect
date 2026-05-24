# ──────────────────────────────────────────────────────────────────────────────
# Dockerfile — Eye Tracking Service
#
# מטרה: בניית Docker image שכולל את כל מה שהשירות צריך.
#   אותו פטרן בדיוק כמו face_recognition/Dockerfile.
#
# אופציה A: הורדת MediaPipe model בזמן build (לא בזמן הרצה).
#   → השירות עובד ללא אינטרנט לאחר ה-build.
#   → אבטחה: אנחנו יודעים בדיוק מה בתוך ה-image.
# ──────────────────────────────────────────────────────────────────────────────

FROM python:3.11-slim

ENV DEBIAN_FRONTEND=noninteractive

# ── system dependencies (זהה ל-face_recognition) ────────────────────────────
# libgl1, libglib2.0-0 — נדרש ל-OpenCV
# libsm6, libxext6     — נדרש ל-OpenCV GUI (גם headless צריך חלק מהם)
# libgomp1             — נדרש ל-MediaPipe (OpenMP)
# curl                 — נדרש ל-Docker healthcheck
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── התקנת Python dependencies ────────────────────────────────────────────────
COPY requirements.txt .

RUN pip install --no-cache-dir \
    --trusted-host pypi.org \
    --trusted-host pypi.python.org \
    --trusted-host files.pythonhosted.org \
    fastapi==0.111.0 \
    "uvicorn[standard]==0.29.0" \
    mediapipe==0.10.14 \
    opencv-python-headless==4.9.0.80 \
    numpy==1.26.4 \
    pydantic==2.7.1 \
    pydantic-settings==2.3.0

# ── הורדת MediaPipe model בזמן build (אופציה A) ──────────────────────────────
# MediaPipe מוריד את המודל אוטומטית בפעם הראשונה שמייבאים אותו.
# אנחנו עושים את זה כאן (build time) ולא בזמן הרצה.
# הוא נשמר ב: /root/.cache/mediapipe/
# גודל: ~30MB — הרבה פחות מ-buffalo_sc (~100MB)
RUN python -c "\
import mediapipe as mp; \
mp.solutions.face_mesh.FaceMesh(\
    max_num_faces=1, \
    refine_landmarks=True, \
    min_detection_confidence=0.5 \
)"

# ── העתקת קוד הפליקציה ───────────────────────────────────────────────────────
COPY ./app ./app

# ── פורט ─────────────────────────────────────────────────────────────────────
EXPOSE 8010

# ── פקודת הרצה ───────────────────────────────────────────────────────────────
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8010", "--workers", "1"]