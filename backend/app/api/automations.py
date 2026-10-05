import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_db
from ..models import Actor, Automation, AutomationRun, Device, User, UserRole
from ..schemas import AutomationIn, AutomationOut, AutomationPatch, AutomationRunOut
from ..security import current_user, resident_user
from ..services.automations import AutomationValidationError, run_automation, validate_automation

router = APIRouter(prefix="/automations", tags=["automatisations"])


async def _get(db: AsyncSession, auto_id: uuid.UUID) -> Automation:
    auto = await db.get(Automation, auto_id)
    if auto is None:
        raise HTTPException(404, "Automatisation introuvable")
    return auto


@router.get("", response_model=list[AutomationOut])
async def list_automations(_: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    return (await db.scalars(select(Automation).order_by(Automation.created_at))).all()


@router.post("", response_model=AutomationOut, status_code=201)
async def create_automation(body: AutomationIn, user: User = Depends(resident_user), db: AsyncSession = Depends(get_db)):
    try:
        validate_automation(body.trigger, body.conditions, body.actions)
    except AutomationValidationError as exc:
        raise HTTPException(422, str(exc)) from exc
    entity_ids = [a["entity_id"] for a in body.actions if a.get("type") == "device"]
    if entity_ids:
        sensitive = await db.scalar(
            select(Device.entity_id).where(Device.entity_id.in_(entity_ids), Device.is_sensitive.is_(True))
        )
        if sensitive and user.role != UserRole.admin:
            raise HTTPException(403, f"{sensitive} est sensible : réservé aux administrateurs")
    auto = Automation(**body.model_dump(), created_by=Actor.user, owner_id=user.id)
    db.add(auto)
    await db.commit()
    return auto


@router.patch("/{auto_id}", response_model=AutomationOut)
async def update_automation(
    auto_id: uuid.UUID, body: AutomationPatch, _: User = Depends(resident_user), db: AsyncSession = Depends(get_db)
):
    auto = await _get(db, auto_id)
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(auto, key, value)
    await db.commit()
    return auto


@router.delete("/{auto_id}", status_code=204)
async def delete_automation(auto_id: uuid.UUID, _: User = Depends(resident_user), db: AsyncSession = Depends(get_db)):
    await db.delete(await _get(db, auto_id))
    await db.commit()


@router.post("/{auto_id}/run", response_model=AutomationRunOut)
async def run_now(auto_id: uuid.UUID, _: User = Depends(resident_user), db: AsyncSession = Depends(get_db)):
    return await run_automation(db, await _get(db, auto_id), reason="manuel")


@router.get("/{auto_id}/runs", response_model=list[AutomationRunOut])
async def list_runs(auto_id: uuid.UUID, _: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    stmt = (
        select(AutomationRun).where(AutomationRun.automation_id == auto_id)
        .order_by(AutomationRun.started_at.desc()).limit(50)
    )
    return (await db.scalars(stmt)).all()
