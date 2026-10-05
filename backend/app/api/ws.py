import asyncio

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect

from ..db import SessionLocal
from ..security import user_from_token
from ..services.events import broadcaster

router = APIRouter()


@router.websocket("/ws")
async def events_socket(websocket: WebSocket, token: str) -> None:
    """Flux temps réel : changements d'état, actions en attente, notifications."""
    async with SessionLocal() as db:
        try:
            await user_from_token(token, db)
        except HTTPException:
            await websocket.close(code=4401)
            return
    await websocket.accept()
    queue = broadcaster.subscribe()
    try:
        while True:
            try:
                message = await asyncio.wait_for(queue.get(), timeout=25)
            except TimeoutError:
                message = '{"type":"ping"}'  # maintient la connexion à travers les proxys
            await websocket.send_text(message)
    except (WebSocketDisconnect, RuntimeError):
        pass
    finally:
        broadcaster.unsubscribe(queue)
