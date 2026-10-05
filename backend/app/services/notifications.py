"""Notifications du foyer : diffusées en temps réel aux applications de bureau connectées,
qui les affichent comme notifications natives du système (Windows, macOS, Linux)."""

from sqlalchemy.ext.asyncio import AsyncSession

from .events import broadcaster


async def notify_household(db: AsyncSession, *, title: str, body: str) -> int:
    """Diffuse une notification. Retourne le nombre de clients connectés qui la reçoivent."""
    return broadcaster.publish("notification", {"title": title, "body": body})
