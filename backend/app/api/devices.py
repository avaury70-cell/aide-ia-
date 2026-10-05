import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_db
from ..models import Actor, Device, DeviceEvent, Room, User
from ..schemas import DeviceActionIn, DeviceEventOut, DeviceOut, DeviceUpdate, RoomIn, RoomOut
from ..security import admin_user, current_user, resident_user
from ..services.home import execute_device_action, sync_devices
from ..services.homeassistant import HomeAssistantError

router = APIRouter(tags=["maison"])


@router.get("/rooms", response_model=list[RoomOut])
async def list_rooms(_: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    return (await db.scalars(select(Room).order_by(Room.floor, Room.name))).all()


@router.post("/rooms", response_model=RoomOut, status_code=201)
async def create_room(body: RoomIn, _: User = Depends(admin_user), db: AsyncSession = Depends(get_db)):
    room = Room(**body.model_dump())
    db.add(room)
    await db.commit()
    return room


@router.delete("/rooms/{room_id}", status_code=204)
async def delete_room(room_id: uuid.UUID, _: User = Depends(admin_user), db: AsyncSession = Depends(get_db)):
    room = await db.get(Room, room_id)
    if room is None:
        raise HTTPException(404, "Pièce introuvable")
    await db.delete(room)
    await db.commit()


@router.get("/devices", response_model=list[DeviceOut])
async def list_devices(
    domain: str | None = None,
    room_id: uuid.UUID | None = None,
    _: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Device).order_by(Device.domain, Device.name)
    if domain:
        stmt = stmt.where(Device.domain == domain)
    if room_id:
        stmt = stmt.where(Device.room_id == room_id)
    return (await db.scalars(stmt)).all()


@router.post("/devices/sync")
async def sync(_: User = Depends(admin_user), db: AsyncSession = Depends(get_db)):
    try:
        created = await sync_devices(db)
    except HomeAssistantError as exc:
        raise HTTPException(502, str(exc)) from exc
    return {"created": created}


async def _get_device(db: AsyncSession, entity_id: str) -> Device:
    device = await db.scalar(select(Device).where(Device.entity_id == entity_id))
    if device is None:
        raise HTTPException(404, "Appareil introuvable")
    return device


@router.patch("/devices/{entity_id}", response_model=DeviceOut)
async def update_device(
    entity_id: str, body: DeviceUpdate, _: User = Depends(admin_user), db: AsyncSession = Depends(get_db)
):
    device = await _get_device(db, entity_id)
    if body.room_id is not None and await db.get(Room, body.room_id) is None:
        raise HTTPException(404, "Pièce introuvable")
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(device, key, value)
    await db.commit()
    await db.refresh(device, ["room"])
    return device


@router.post("/devices/{entity_id}/action")
async def device_action(
    entity_id: str, body: DeviceActionIn, user: User = Depends(resident_user), db: AsyncSession = Depends(get_db)
):
    # Commande manuelle depuis l'application : le geste de l'utilisateur vaut confirmation.
    result = await execute_device_action(
        db, entity_id=entity_id, action=body.action, parameters=body.parameters,
        actor=Actor.user, user=user, confirmed=True,
    )
    if result["status"] == "error":
        raise HTTPException(400, result["error"])
    return result


@router.get("/devices/{entity_id}/history", response_model=list[DeviceEventOut])
async def device_history(
    entity_id: str,
    hours: int = Query(24, ge=1, le=24 * 30),
    _: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    stmt = (
        select(DeviceEvent)
        .where(DeviceEvent.entity_id == entity_id, DeviceEvent.occurred_at >= since)
        .order_by(DeviceEvent.occurred_at.desc())
        .limit(500)
    )
    return (await db.scalars(stmt)).all()
