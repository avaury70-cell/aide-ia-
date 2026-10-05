"""Diffusion temps réel vers les applications mobiles connectées (WebSocket /ws)."""

import asyncio
import json
from typing import Any


class EventBroadcaster:
    def __init__(self) -> None:
        self._queues: set[asyncio.Queue[str]] = set()

    def subscribe(self) -> asyncio.Queue[str]:
        q: asyncio.Queue[str] = asyncio.Queue(maxsize=200)
        self._queues.add(q)
        return q

    def unsubscribe(self, q: asyncio.Queue[str]) -> None:
        self._queues.discard(q)

    def publish(self, event_type: str, data: dict[str, Any]) -> None:
        message = json.dumps({"type": event_type, "data": data}, default=str)
        for q in list(self._queues):
            if q.full():  # client trop lent : on jette l'événement le plus ancien
                q.get_nowait()
            q.put_nowait(message)


broadcaster = EventBroadcaster()
