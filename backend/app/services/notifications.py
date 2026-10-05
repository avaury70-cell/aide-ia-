"""Notifications push via le service Expo (iOS APNs + Android FCM unifiés)."""

import logging

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import PushToken
from .events import broadcaster

log = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


async def notify_household(db: AsyncSession, *, title: str, body: str) -> int:
    """Envoie une notification à tous les appareils enregistrés. Retourne le nombre d'envois."""
    broadcaster.publish("notification", {"title": title, "body": body})
    tokens = (await db.scalars(select(PushToken.token))).all()
    if not tokens:
        return 0
    messages = [{"to": t, "title": title, "body": body, "sound": "default"} for t in tokens]
    try:
        async with httpx.AsyncClient(timeout=10) as http:
            resp = await http.post(EXPO_PUSH_URL, json=messages)
            resp.raise_for_status()
    except httpx.HTTPError as exc:
        log.warning("Échec de l'envoi push : %s", exc)
        return 0
    return len(messages)
