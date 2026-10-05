"""Moteur d'automatisations : déclencheurs horaires (cron) et sur changement d'état."""

import asyncio
import logging
from datetime import datetime, timezone
from typing import Any
from zoneinfo import ZoneInfo

from croniter import croniter
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from ..config import get_settings
from ..models import Actor, Automation, AutomationRun, Device
from .home import execute_device_action
from .notifications import notify_household

log = logging.getLogger(__name__)


class AutomationValidationError(ValueError):
    pass


def validate_automation(trigger: dict[str, Any], conditions: list[dict], actions: list[dict]) -> None:
    ttype = trigger.get("type")
    if ttype == "time":
        cron = trigger.get("cron", "")
        if not croniter.is_valid(cron):
            raise AutomationValidationError(f"Expression cron invalide : {cron!r}")
    elif ttype == "state":
        if not trigger.get("entity_id"):
            raise AutomationValidationError("Déclencheur d'état : entity_id requis")
    else:
        raise AutomationValidationError("Type de déclencheur inconnu (attendu : time | state)")
    for cond in conditions:
        if not cond.get("entity_id") or "state" not in cond:
            raise AutomationValidationError("Chaque condition requiert entity_id et state")
    if not actions:
        raise AutomationValidationError("Au moins une action est requise")
    for act in actions:
        if act.get("type") == "notify":
            if not act.get("message"):
                raise AutomationValidationError("Action notify : message requis")
        elif act.get("type") == "device":
            if not act.get("entity_id") or not act.get("action"):
                raise AutomationValidationError("Action device : entity_id et action requis")
        else:
            raise AutomationValidationError("Type d'action inconnu (attendu : device | notify)")


def cron_is_due(cron: str, last_run: datetime | None, now: datetime, tz: ZoneInfo) -> bool:
    """Vrai si une occurrence cron (heure locale du domicile) est tombée depuis le dernier passage."""
    local_now = now.astimezone(tz)
    previous = croniter(cron, local_now).get_prev(datetime)
    if last_run is None:
        # Première exécution : seulement si l'occurrence est très récente (pas de rattrapage).
        return (local_now - previous).total_seconds() < get_settings().automation_tick_seconds * 2
    if last_run.tzinfo is None:
        last_run = last_run.replace(tzinfo=timezone.utc)
    return previous > last_run.astimezone(tz)


def state_trigger_matches(trigger: dict[str, Any], event: dict[str, Any]) -> bool:
    if trigger.get("type") != "state" or trigger.get("entity_id") != event.get("entity_id"):
        return False
    new = (event.get("new_state") or {}).get("state")
    old = (event.get("old_state") or {}).get("state")
    if new == old:
        return False
    if "to" in trigger and trigger["to"] != new:
        return False
    if "from" in trigger and trigger["from"] != old:
        return False
    return True


async def conditions_met(db: AsyncSession, conditions: list[dict]) -> bool:
    for cond in conditions:
        device = await db.scalar(select(Device).where(Device.entity_id == cond["entity_id"]))
        if device is None or device.state != str(cond["state"]):
            return False
    return True


async def run_automation(db: AsyncSession, automation: Automation, reason: str) -> AutomationRun:
    now = datetime.now(timezone.utc)
    automation.last_run_at = now
    if not await conditions_met(db, automation.conditions or []):
        run = AutomationRun(automation_id=automation.id, status="skipped",
                            detail={"reason": reason, "why": "conditions non remplies"})
        db.add(run)
        await db.commit()
        return run

    results: list[dict[str, Any]] = []
    for act in automation.actions:
        if act["type"] == "notify":
            await notify_household(db, title=automation.name, body=act["message"])
            results.append({"notify": act["message"]})
        else:
            # Les automatisations sont validées à la création : pas de confirmation à l'exécution.
            res = await execute_device_action(
                db, entity_id=act["entity_id"], action=act["action"], parameters=act.get("parameters"),
                actor=Actor.automation, user=None, confirmed=True,
            )
            results.append(res)
    status = "error" if any(r.get("status") == "error" for r in results) else "success"
    run = AutomationRun(automation_id=automation.id, status=status, detail={"reason": reason, "results": results})
    db.add(run)
    await db.commit()
    return run


class AutomationEngine:
    def __init__(self, session_factory: async_sessionmaker[AsyncSession]) -> None:
        self._sessions = session_factory
        self._tz = ZoneInfo(get_settings().home_timezone)

    async def run_scheduler(self, stop: asyncio.Event) -> None:
        tick = get_settings().automation_tick_seconds
        while not stop.is_set():
            try:
                await self.tick(datetime.now(timezone.utc))
            except Exception:
                log.exception("Erreur dans le planificateur d'automatisations")
            try:
                await asyncio.wait_for(stop.wait(), timeout=tick)
            except TimeoutError:
                pass

    async def tick(self, now: datetime) -> None:
        async with self._sessions() as db:
            autos = (await db.scalars(select(Automation).where(Automation.enabled.is_(True)))).all()
            for auto in autos:
                if auto.trigger.get("type") == "time" and cron_is_due(
                    auto.trigger["cron"], auto.last_run_at, now, self._tz
                ):
                    await run_automation(db, auto, reason=f"cron {auto.trigger['cron']}")

    async def on_state_change(self, db: AsyncSession, event: dict[str, Any]) -> None:
        autos = (await db.scalars(select(Automation).where(Automation.enabled.is_(True)))).all()
        for auto in autos:
            if state_trigger_matches(auto.trigger, event):
                await run_automation(db, auto, reason=f"état {event['entity_id']}")
