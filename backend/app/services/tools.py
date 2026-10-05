"""Outils mis à disposition de Claude. Chaque outil passe par la couche métier sécurisée."""

import json
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Actor, Automation, Device, DeviceEvent, Memory, Room, User
from .automations import AutomationValidationError, validate_automation
from .home import device_summary, execute_device_action
from .notifications import notify_household

TOOLS: list[dict[str, Any]] = [
    {
        "name": "list_devices",
        "description": (
            "Liste les appareils et capteurs de la maison avec leur état actuel et les actions possibles. "
            "Filtrer par pièce et/ou domaine (light, switch, climate, cover, lock, sensor, media_player…). "
            "À appeler avant toute commande si l'entity_id exact n'est pas connu."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "room": {"type": "string", "description": "Nom de la pièce, ex. « Salon »"},
                "domain": {"type": "string", "description": "Domaine Home Assistant, ex. « light »"},
            },
        },
    },
    {
        "name": "get_device_state",
        "description": "Renvoie l'état détaillé d'un appareil (température, luminosité, position…).",
        "input_schema": {
            "type": "object",
            "properties": {"entity_id": {"type": "string"}},
            "required": ["entity_id"],
        },
    },
    {
        "name": "control_device",
        "description": (
            "Exécute une action sur un appareil. Actions par domaine : light(turn_on, turn_off, toggle ; "
            "params brightness_pct 0-100, color_temp_kelvin, rgb_color [r,g,b], transition), "
            "switch(turn_on, turn_off, toggle), climate(set_temperature{temperature,hvac_mode}, "
            "set_hvac_mode{hvac_mode}, turn_on, turn_off), cover(open, close, stop, set_position{position}), "
            "lock(lock, unlock), alarm_control_panel(arm_home, arm_away, arm_night, disarm), "
            "media_player(play, pause, stop, set_volume{volume_level 0-1}, turn_on, turn_off), "
            "fan(turn_on, turn_off, set_percentage), vacuum(start, stop, return_to_base), "
            "scene/script(activate). Les actions sensibles (serrures, alarme, volets, vannes) renvoient "
            "status=confirmation_required : l'utilisateur doit alors valider dans l'application."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "entity_id": {"type": "string"},
                "action": {"type": "string"},
                "parameters": {"type": "object", "description": "Paramètres optionnels de l'action"},
            },
            "required": ["entity_id", "action"],
        },
    },
    {
        "name": "get_history",
        "description": "Historique des changements d'état d'un appareil sur les N dernières heures.",
        "input_schema": {
            "type": "object",
            "properties": {
                "entity_id": {"type": "string"},
                "hours": {"type": "integer", "minimum": 1, "maximum": 168, "default": 24},
            },
            "required": ["entity_id"],
        },
    },
    {
        "name": "create_automation",
        "description": (
            "Crée une automatisation persistante. trigger : {\"type\":\"time\",\"cron\":\"30 7 * * 1-5\"} "
            "(cron 5 champs, heure locale du domicile) ou {\"type\":\"state\",\"entity_id\":...,"
            "\"to\":\"on\",\"from\":\"off\"}. conditions : [{\"entity_id\":...,\"state\":...}]. actions : "
            "[{\"type\":\"device\",\"entity_id\":...,\"action\":...,\"parameters\":{}}] ou "
            "[{\"type\":\"notify\",\"message\":...}]. Toujours résumer la règle à l'utilisateur avant "
            "de la créer s'il ne l'a pas formulée explicitement."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "description": {"type": "string"},
                "trigger": {"type": "object"},
                "conditions": {"type": "array", "items": {"type": "object"}},
                "actions": {"type": "array", "items": {"type": "object"}},
            },
            "required": ["name", "trigger", "actions"],
        },
    },
    {
        "name": "list_automations",
        "description": "Liste les automatisations existantes avec leur statut.",
        "input_schema": {"type": "object", "properties": {}},
    },
    {
        "name": "set_automation_enabled",
        "description": "Active ou désactive une automatisation existante.",
        "input_schema": {
            "type": "object",
            "properties": {"automation_id": {"type": "string"}, "enabled": {"type": "boolean"}},
            "required": ["automation_id", "enabled"],
        },
    },
    {
        "name": "remember",
        "description": (
            "Mémorise durablement une préférence ou une habitude de l'utilisateur (ex. « aime 19 °C "
            "dans la chambre la nuit »). shared=true si l'information concerne tout le foyer."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "content": {"type": "string"},
                "category": {"type": "string", "enum": ["preference", "routine", "household", "general"]},
                "shared": {"type": "boolean", "default": False},
            },
            "required": ["content"],
        },
    },
    {
        "name": "recall",
        "description": "Recherche dans la mémoire à long terme (mots-clés). Sans requête : tout renvoyer.",
        "input_schema": {"type": "object", "properties": {"query": {"type": "string"}}},
    },
    {
        "name": "forget",
        "description": "Supprime un souvenir à la demande de l'utilisateur.",
        "input_schema": {
            "type": "object",
            "properties": {"memory_id": {"type": "string"}},
            "required": ["memory_id"],
        },
    },
    {
        "name": "notify_household",
        "description": "Envoie une notification push à tous les membres du foyer.",
        "input_schema": {
            "type": "object",
            "properties": {"title": {"type": "string"}, "message": {"type": "string"}},
            "required": ["title", "message"],
        },
    },
]


@dataclass
class ToolContext:
    db: AsyncSession
    user: User
    conversation_id: uuid.UUID | None = None
    pending_action_ids: list[str] = field(default_factory=list)


class ToolInputError(ValueError):
    pass


def _require(inp: dict[str, Any], key: str, typ: type) -> Any:
    value = inp.get(key)
    if not isinstance(value, typ):
        raise ToolInputError(f"Paramètre '{key}' manquant ou invalide")
    return value


async def execute_tool(ctx: ToolContext, name: str, inp: dict[str, Any]) -> tuple[str, bool]:
    """Exécute un outil. Retourne (contenu JSON, is_error)."""
    handler = _HANDLERS.get(name)
    if handler is None:
        return json.dumps({"error": f"Outil inconnu : {name}"}), True
    if not isinstance(inp, dict):
        return json.dumps({"error": "Entrée d'outil invalide"}), True
    try:
        result = await handler(ctx, inp)
    except ToolInputError as exc:
        return json.dumps({"error": str(exc)}, ensure_ascii=False), True
    is_error = isinstance(result, dict) and result.get("status") == "error"
    return json.dumps(result, ensure_ascii=False, default=str), is_error


async def _list_devices(ctx: ToolContext, inp: dict[str, Any]) -> Any:
    stmt = select(Device).where(Device.is_exposed.is_(True)).order_by(Device.domain, Device.name)
    if domain := inp.get("domain"):
        stmt = stmt.where(Device.domain == domain)
    if room := inp.get("room"):
        stmt = stmt.join(Room).where(Room.name.ilike(f"%{room}%"))
    devices = (await ctx.db.scalars(stmt)).all()
    return {"count": len(devices), "devices": [device_summary(d) for d in devices]}


async def _get_device_state(ctx: ToolContext, inp: dict[str, Any]) -> Any:
    entity_id = _require(inp, "entity_id", str)
    device = await ctx.db.scalar(
        select(Device).where(Device.entity_id == entity_id, Device.is_exposed.is_(True))
    )
    if device is None:
        return {"status": "error", "error": f"Appareil inconnu : {entity_id}"}
    return {**device_summary(device), "all_attributes": device.attributes,
            "last_changed_at": device.last_changed_at}


async def _control_device(ctx: ToolContext, inp: dict[str, Any]) -> Any:
    params = inp.get("parameters") or {}
    if not isinstance(params, dict):
        raise ToolInputError("'parameters' doit être un objet")
    result = await execute_device_action(
        ctx.db,
        entity_id=_require(inp, "entity_id", str),
        action=_require(inp, "action", str),
        parameters=params,
        actor=Actor.assistant,
        user=ctx.user,
        conversation_id=ctx.conversation_id,
    )
    if result.get("status") == "confirmation_required":
        ctx.pending_action_ids.append(result["pending_action_id"])
    return result


async def _get_history(ctx: ToolContext, inp: dict[str, Any]) -> Any:
    entity_id = _require(inp, "entity_id", str)
    hours = inp.get("hours", 24)
    if not isinstance(hours, int) or not 1 <= hours <= 168:
        raise ToolInputError("'hours' doit être un entier entre 1 et 168")
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    events = (
        await ctx.db.scalars(
            select(DeviceEvent)
            .where(DeviceEvent.entity_id == entity_id, DeviceEvent.occurred_at >= since)
            .order_by(DeviceEvent.occurred_at.desc())
            .limit(100)
        )
    ).all()
    return {"entity_id": entity_id, "events": [
        {"at": e.occurred_at, "from": e.old_state, "to": e.new_state} for e in events
    ]}


async def _create_automation(ctx: ToolContext, inp: dict[str, Any]) -> Any:
    if ctx.user.role.value == "guest":
        return {"status": "error", "error": "Les invités ne peuvent pas créer d'automatisations"}
    trigger = _require(inp, "trigger", dict)
    actions = _require(inp, "actions", list)
    conditions = inp.get("conditions") or []
    try:
        validate_automation(trigger, conditions, actions)
    except AutomationValidationError as exc:
        return {"status": "error", "error": str(exc)}
    # L'IA ne peut pas automatiser d'actions sensibles : elles doivent être créées
    # manuellement par un administrateur depuis l'application.
    entity_ids = [a["entity_id"] for a in actions if a.get("type") == "device"]
    if entity_ids:
        devices = {
            d.entity_id: d
            for d in (await ctx.db.scalars(select(Device).where(Device.entity_id.in_(entity_ids)))).all()
        }
        for eid in entity_ids:
            dev = devices.get(eid)
            if dev is None or not dev.is_exposed:
                return {"status": "error", "error": f"Appareil inconnu : {eid}"}
            if dev.is_sensitive:
                return {"status": "error", "error": (
                    f"{dev.name} est un appareil sensible : cette automatisation doit être créée "
                    "par un administrateur dans l'onglet Automatisations."
                )}
    auto = Automation(
        name=_require(inp, "name", str),
        description=inp.get("description"),
        trigger=trigger,
        conditions=conditions,
        actions=actions,
        created_by=Actor.assistant,
        owner_id=ctx.user.id,
    )
    ctx.db.add(auto)
    await ctx.db.commit()
    return {"status": "created", "automation_id": str(auto.id), "name": auto.name}


async def _list_automations(ctx: ToolContext, inp: dict[str, Any]) -> Any:
    autos = (await ctx.db.scalars(select(Automation).order_by(Automation.created_at))).all()
    return {"automations": [
        {"id": str(a.id), "name": a.name, "enabled": a.enabled, "trigger": a.trigger,
         "conditions": a.conditions, "actions": a.actions, "last_run_at": a.last_run_at}
        for a in autos
    ]}


async def _set_automation_enabled(ctx: ToolContext, inp: dict[str, Any]) -> Any:
    try:
        auto_id = uuid.UUID(_require(inp, "automation_id", str))
    except ValueError as exc:
        raise ToolInputError("automation_id invalide") from exc
    enabled = _require(inp, "enabled", bool)
    auto = await ctx.db.get(Automation, auto_id)
    if auto is None:
        return {"status": "error", "error": "Automatisation introuvable"}
    auto.enabled = enabled
    await ctx.db.commit()
    return {"status": "updated", "automation_id": str(auto.id), "enabled": enabled}


async def _remember(ctx: ToolContext, inp: dict[str, Any]) -> Any:
    mem = Memory(
        user_id=None if inp.get("shared") else ctx.user.id,
        category=inp.get("category") or "general",
        content=_require(inp, "content", str),
        source=Actor.assistant,
    )
    ctx.db.add(mem)
    await ctx.db.commit()
    return {"status": "remembered", "memory_id": str(mem.id)}


async def _recall(ctx: ToolContext, inp: dict[str, Any]) -> Any:
    memories = await memories_for_user(ctx.db, ctx.user, query=inp.get("query"))
    now = datetime.now(timezone.utc)
    for m in memories:
        m.last_used_at = now
    await ctx.db.commit()
    return {"memories": [{"id": str(m.id), "category": m.category, "content": m.content} for m in memories]}


async def _forget(ctx: ToolContext, inp: dict[str, Any]) -> Any:
    try:
        mem_id = uuid.UUID(_require(inp, "memory_id", str))
    except ValueError as exc:
        raise ToolInputError("memory_id invalide") from exc
    mem = await ctx.db.get(Memory, mem_id)
    if mem is None or (mem.user_id is not None and mem.user_id != ctx.user.id):
        return {"status": "error", "error": "Souvenir introuvable"}
    await ctx.db.delete(mem)
    await ctx.db.commit()
    return {"status": "forgotten"}


async def _notify(ctx: ToolContext, inp: dict[str, Any]) -> Any:
    sent = await notify_household(ctx.db, title=_require(inp, "title", str), body=_require(inp, "message", str))
    return {"status": "sent", "devices": sent}


async def memories_for_user(db: AsyncSession, user: User, query: str | None = None, limit: int = 50) -> list[Memory]:
    stmt = select(Memory).where(or_(Memory.user_id == user.id, Memory.user_id.is_(None)))
    if query:
        words = [w for w in query.split() if len(w) > 2] or [query]
        stmt = stmt.where(or_(*[Memory.content.ilike(f"%{w}%") for w in words]))
    stmt = stmt.order_by(Memory.created_at.desc()).limit(limit)
    return list((await db.scalars(stmt)).all())


_HANDLERS = {
    "list_devices": _list_devices,
    "get_device_state": _get_device_state,
    "control_device": _control_device,
    "get_history": _get_history,
    "create_automation": _create_automation,
    "list_automations": _list_automations,
    "set_automation_enabled": _set_automation_enabled,
    "remember": _remember,
    "recall": _recall,
    "forget": _forget,
    "notify_household": _notify,
}
