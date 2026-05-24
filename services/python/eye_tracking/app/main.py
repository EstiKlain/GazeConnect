# ──────────────────────────────────────────────────────────────────────────────
# main.py
#
# מטרה: נקודת כניסה — בונה FastAPI app, מחבר routes, מנהל lifespan.
#   אותו פטרן כמו face_recognition/app/main.py.
#
#   אחרי הפיצול main.py הרבה יותר קצר וברור:
#   - ConnectionManager ו-WebSocket endpoint → api/ws.py
#   - Pydantic models                        → core/models.py
#   - GazeEstimator                          → gaze_estimator.py
#   - KalmanFilter                           → kalman_filter.py
#   - Settings                               → config.py
# ──────────────────────────────────────────────────────────────────────────────

import asyncio
import json
import logging
import time
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.gaze_estimator import GazeEstimator
from app.api.ws import manager, router as ws_router
from app.core.models import HealthResponse

# הגדרת logging — פורט שורה זרה, וקצר (זהה ל-face_recognition)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s"
)
logger = logging.getLogger(__name__)

# global — נגיש ל-lifespan ול-health endpoint
gaze_estimator: GazeEstimator | None = None


# ──────────────────────────────────────────────────────────────────────────────
# Lifespan — startup / shutdown (אותו פטרן כמו face_recognition)
# ──────────────────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    ניהול חזור החיים של הפליקציה.
    קוד לפני yield = startup, קוד אחרי yield = shutdown.
    """
    global gaze_estimator

    # ── STARTUP ────────────────────────────────────────────────────────────
    logger.info("Starting GazeConnect Eye Tracking Service...")

    # 1. יצירת GazeEstimator (פותח מצלמה + טוען MediaPipe)
    logger.info("Opening camera (index=%d)...", settings.camera_index)
    gaze_estimator = GazeEstimator(
        camera_index=settings.camera_index,
        frame_width=settings.frame_width,
        frame_height=settings.frame_height,
        process_noise=settings.kalman_process_noise,
        measure_noise=settings.kalman_measure_noise,
    )
    gaze_estimator.start()

    # 2. שמירה ב-app.state (זמין לכל endpoint)
    app.state.estimator = gaze_estimator

    # 3. הפעלת broadcast loop ברקע
    task = asyncio.create_task(_broadcast_loop())

    logger.info("✓ Eye Tracking Service is ready on port %d!", settings.port)

    yield  # ← השירות רץ וקבל בקשות

    # ── SHUTDOWN ───────────────────────────────────────────────────────────
    logger.info("Shutting down Eye Tracking Service...")
    task.cancel()
    if gaze_estimator:
        gaze_estimator.stop()
    logger.info("Camera closed. Goodbye!")


async def _broadcast_loop() -> None:
    """
    רץ ברקע כל 33ms (30fps).
    שולח gaze point לכל Angular clients מחוברים.
    """
    while True:
        start = time.monotonic()

        if manager.has_clients and gaze_estimator:
            point = gaze_estimator.get_latest_gaze()
            if point:
                payload = json.dumps({
                    "x":          round(point["x"], 1),
                    "y":          round(point["y"], 1),
                    "confidence": round(point["confidence"], 3),
                    "ts":         int(time.time() * 1000),
                })
                await manager.broadcast(payload)

        elapsed = time.monotonic() - start
        await asyncio.sleep(max(0.0, 0.033 - elapsed))


# ──────────────────────────────────────────────────────────────────────────────
# FastAPI App
# ──────────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="GazeConnect Eye Tracking Service",
    description="MediaPipe Face Mesh → Gaze Point → WebSocket → Angular",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — פשר לAngular (localhost:4200) לגשת לשירות
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://localhost:5000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ────────────────────────────────────────────────────────────────────
app.include_router(ws_router)   # WebSocket: /ws/gaze


# ──────────────────────────────────────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse)
async def health():
    """בדיקת תקינות — Docker healthcheck קורא לכאן."""
    return HealthResponse(
        status="ok",
        camera_ok=gaze_estimator.is_running if gaze_estimator else False,
        clients=manager.client_count,
    )


# ──────────────────────────────────────────────────────────────────────────────
# Entry point
# ──────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=False,
        log_level="info",
    )