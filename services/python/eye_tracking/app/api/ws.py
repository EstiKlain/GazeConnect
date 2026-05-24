# ──────────────────────────────────────────────────────────────────────────────
# api/ws.py
#
# מטרה: WebSocket endpoint + ConnectionManager.
#   אותו פטרן כמו face_recognition/app/api/recognize.py.
#
#   ConnectionManager — מנהל את כל חיבורי ה-WebSocket הפתוחים.
#   gaze_websocket    — endpoint שAngular מתחבר אליו.
#
# זרימה:
#   Angular → ws://localhost:8010/ws/gaze → gaze_websocket → ConnectionManager
#   broadcast_loop (ב-main.py) → manager.broadcast() → כל הלקוחות
# ──────────────────────────────────────────────────────────────────────────────

import logging
from typing import Set

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)

router = APIRouter()


class ConnectionManager:
    """
    מנהל את כל חיבורי ה-WebSocket הפתוחים.
    broadcast() שולח לכולם במקביל ומסיר חיבורים מתים אוטומטית.
    """

    def __init__(self) -> None:
        self._clients: Set[WebSocket] = set()

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        self._clients.add(ws)
        logger.info("Client connected. Total: %d", len(self._clients))

    def disconnect(self, ws: WebSocket) -> None:
        self._clients.discard(ws)
        logger.info("Client disconnected. Total: %d", len(self._clients))

    async def broadcast(self, message: str) -> None:
        """שולח הודעה לכל הלקוחות, מסיר מתים אוטומטית."""
        dead: Set[WebSocket] = set()
        for client in self._clients:
            try:
                await client.send_text(message)
            except Exception:
                dead.add(client)
        self._clients -= dead

    @property
    def has_clients(self) -> bool:
        return bool(self._clients)

    @property
    def client_count(self) -> int:
        return len(self._clients)


# instance יחיד — משותף ל-main.py ול-ws.py
manager = ConnectionManager()


@router.websocket("/ws/gaze")
async def gaze_websocket(ws: WebSocket):
    """
    WebSocket endpoint.
    Angular מתחבר כאן וקבל gaze points כל 33ms.

    אין הודעות נכנסות מהלקוח כרגע —
    בעתיד אפשר להוסיף: screen_size, calibration_data וכו'.
    """
    await manager.connect(ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(ws)