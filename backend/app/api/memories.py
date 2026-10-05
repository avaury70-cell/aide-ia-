import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_db
from ..models import Memory, User
from ..schemas import MemoryOut
from ..security import current_user
from ..services.tools import memories_for_user

router = APIRouter(prefix="/memories", tags=["mémoire"])


@router.get("", response_model=list[MemoryOut])
async def list_memories(user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    return await memories_for_user(db, user, limit=500)


@router.delete("/{memory_id}", status_code=204)
async def delete_memory(memory_id: uuid.UUID, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    mem = await db.get(Memory, memory_id)
    if mem is None or (mem.user_id is not None and mem.user_id != user.id):
        raise HTTPException(404, "Souvenir introuvable")
    await db.delete(mem)
    await db.commit()
