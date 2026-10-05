"""Logique métier domotique : inventaire, exécution sécurisée des commandes, événements."""

import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import get_settings
from ..models import Actor, AuditLog, Device, DeviceEvent, PendingAction, PendingStatus, User, UserRole
from .events import broadcaster
from .homeassistant import ACTIONS, HomeAssistantError, get_home_client, resolve_action

log = logging.getLogger(__name__)

# Domaines lisibles par l'assistant en plus des domaines pilotables.
READABLE_DOMAINS = set(ACTIONS) | {"sensor", "binary_sensor", "weather", "person"}


def is_sensitive_domain(domain: str) -> bool:
    return domain in get_settings().sensitive_domains


async def sync_devices(db: AsyncSession) -> int:
    """Importe/actualise les entités Home Assistant. Retourne le nombre d'entités créées."""
    states = await get_home_client().get_states()
    existing = {d.entity_id: d for d in (await db.scalars(select(Device))).all()}
    created = 0
    for st in states:
        entity_id = st["entity_id"]
        domain = entity_id.split(".", 1)[0]
        attrs = st.get("attributes", {})
        device = existing.get(entity_id)
        if device is None:
            if domain not in READABLE_DOMAINS:
                continue
            device = Device(
                entity_id=entity_id,
                domain=domain,
                name=attrs.get("friendly_name", entity_id),
                is_sensitive=is_sensitive_domain(domain),
                is_exposed=True,
            )
            db.add(device)
            created += 1
        device.device_class = attrs.get("device_class")
        device.state = st.get("state")
        device.attributes = attrs
        device.last_changed_at = _parse_ts(st.get("last_changed"))
    await db.commit()
    return created


def device_summary(device: Device) -> dict[str, Any]:
    attrs = device.attributes or {}
    useful = {
        k: attrs[k]
        for k in (
            "unit_of_measurement", "brightness", "color_temp_kelvin", "current_temperature",
            "temperature", "hvac_mode", "current_position", "volume_level", "media_title", "battery_level",
        )
        if k in attrs
    }
    return {
        "entity_id": device.entity_id,
        "name": device.name,
        "domain": device.domain,
        "room": device.room.name if device.room else None,
        "state": device.state,
        "attributes": useful,
        "sensitive": device.is_sensitive,
        "actions": sorted(ACTIONS.get(device.domain, {})),
    }


async def execute_device_action(
    db: AsyncSession,
    *,
    entity_id: str,
    action: str,
    parameters: dict[str, Any] | None,
    actor: Actor,
    user: User | None,
    conversation_id: uuid.UUID | None = None,
    confirmed: bool = False,
) -> dict[str, Any]:
    """Point d'entrée unique de toute commande : contrôle d'accès, confirmation, audit."""
    device = await db.scalar(select(Device).where(Device.entity_id == entity_id))
    if device is None or (actor == Actor.assistant and not device.is_exposed):
        return {"status": "error", "error": f"Appareil inconnu ou non accessible : {entity_id}"}
    if user is not None and user.role == UserRole.guest:
        return {"status": "error", "error": "Les invités ne peuvent pas piloter la maison"}

    try:
        call = resolve_action(entity_id, action, parameters)
    except HomeAssistantError as exc:
        return {"status": "error", "error": str(exc)}

    needs_confirmation = device.is_sensitive or is_sensitive_domain(device.domain)
    if needs_confirmation and not confirmed:
        if user is None:
            return {"status": "error", "error": "Action sensible impossible sans utilisateur"}
        pending = PendingAction(
            user_id=user.id,
            conversation_id=conversation_id,
            entity_id=entity_id,
            action=action,
            parameters=parameters or {},
            summary=f"{action} → {device.name}",
            expires_at=datetime.now(timezone.utc) + timedelta(seconds=get_settings().pending_action_ttl_seconds),
        )
        db.add(pending)
        await db.commit()
        broadcaster.publish("pending_action", {"id": str(pending.id), "summary": pending.summary})
        return {
            "status": "confirmation_required",
            "pending_action_id": str(pending.id),
            "message": "Action sensible : l'utilisateur doit la confirmer dans l'application.",
        }

    success, error = True, None
    try:
        await get_home_client().call_service(call)
    except HomeAssistantError as exc:
        success, error = False, str(exc)

    db.add(
        AuditLog(
            user_id=user.id if user else None,
            actor=actor,
            action=f"{call.domain}.{call.service}",
            target=entity_id,
            payload=call.data,
            success=success,
        )
    )
    await db.commit()
    if not success:
        return {"status": "error", "error": error}
    return {"status": "done", "entity_id": entity_id, "service": f"{call.domain}.{call.service}"}


async def resolve_pending_action(
    db: AsyncSession, pending: PendingAction, user: User, approve: bool
) -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    if pending.status != PendingStatus.pending:
        return {"status": "error", "error": f"Action déjà traitée ({pending.status.value})"}
    if _aware(pending.expires_at) < now:
        pending.status = PendingStatus.expired
        await db.commit()
        return {"status": "error", "error": "Action expirée"}
    pending.resolved_at = now
    if not approve:
        pending.status = PendingStatus.rejected
        await db.commit()
        return {"status": "rejected"}
    result = await execute_device_action(
        db,
        entity_id=pending.entity_id,
        action=pending.action,
        parameters=pending.parameters,
        actor=Actor.user,
        user=user,
        conversation_id=pending.conversation_id,
        confirmed=True,
    )
    pending.status = PendingStatus.confirmed if result["status"] == "done" else PendingStatus.failed
    await db.commit()
    return result


async def record_state_change(db: AsyncSession, data: dict[str, Any]) -> Device | None:
    """Met à jour l'état connu d'un appareil à partir d'un événement HA `state_changed`."""
    entity_id = data.get("entity_id")
    new = data.get("new_state") or {}
    old = data.get("old_state") or {}
    device = await db.scalar(select(Device).where(Device.entity_id == entity_id))
    if device is None:
        return None
    device.state = new.get("state")
    device.attributes = new.get("attributes", {})
    device.last_changed_at = _parse_ts(new.get("last_changed")) or datetime.now(timezone.utc)
    # On n'historise que les vrais changements d'état (pas les attributs seuls).
    if old.get("state") != new.get("state"):
        db.add(DeviceEvent(entity_id=entity_id, old_state=old.get("state"), new_state=new.get("state"),
                           attributes=device.attributes))
    await db.commit()
    broadcaster.publish("state_changed", {"entity_id": entity_id, "state": device.state,
                                          "attributes": device.attributes})
    return device


def _parse_ts(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def _aware(dt: datetime) -> datetime:
    # SQLite restitue des datetimes naïfs ; on les considère en UTC.
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
