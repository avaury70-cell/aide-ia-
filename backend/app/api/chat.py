import uuid
from datetime import datetime, timedelta, timezone

import anthropic
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_db
from ..models import Conversation, Message, PendingAction, PendingStatus, User
from ..schemas import ChatReply, ConversationOut, MessageIn, MessageOut, PendingActionOut
from ..security import current_user
from ..services.assistant import run_turn
from ..services.home import resolve_pending_action

router = APIRouter(tags=["assistant"])


async def _own_conversation(db: AsyncSession, conv_id: uuid.UUID, user: User) -> Conversation:
    conv = await db.get(Conversation, conv_id)
    if conv is None or conv.user_id != user.id:
        raise HTTPException(404, "Conversation introuvable")
    return conv


@router.get("/conversations", response_model=list[ConversationOut])
async def list_conversations(user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    stmt = select(Conversation).where(Conversation.user_id == user.id).order_by(Conversation.updated_at.desc())
    return (await db.scalars(stmt)).all()


@router.post("/conversations", response_model=ConversationOut, status_code=201)
async def create_conversation(user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    conv = Conversation(user_id=user.id)
    db.add(conv)
    await db.commit()
    return conv


@router.delete("/conversations/{conv_id}", status_code=204)
async def delete_conversation(
    conv_id: uuid.UUID, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)
):
    await db.delete(await _own_conversation(db, conv_id, user))
    await db.commit()


@router.get("/conversations/{conv_id}/messages", response_model=list[MessageOut])
async def list_messages(conv_id: uuid.UUID, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    await _own_conversation(db, conv_id, user)
    stmt = select(Message).where(Message.conversation_id == conv_id).order_by(Message.created_at)
    return (await db.scalars(stmt)).all()


@router.post("/conversations/{conv_id}/messages", response_model=ChatReply)
async def send_message(
    conv_id: uuid.UUID, body: MessageIn, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)
):
    conv = await _own_conversation(db, conv_id, user)
    try:
        turn = await run_turn(db, user, conv, body.content)
    except anthropic.RateLimitError as exc:
        raise HTTPException(429, "Assistant momentanément saturé, réessayez dans un instant") from exc
    except anthropic.APIStatusError as exc:
        raise HTTPException(502, f"Erreur du service d'IA ({exc.status_code})") from exc
    except anthropic.APIConnectionError as exc:
        raise HTTPException(503, "Service d'IA injoignable") from exc

    # Les deux messages sont enregistrés ensemble : l'historique reste alterné user/assistant.
    now = datetime.now(timezone.utc)
    user_msg = Message(conversation_id=conv.id, role="user", content=body.content, created_at=now)
    db.add(user_msg)
    assistant_msg = Message(
        conversation_id=conv.id, role="assistant", content=turn.text or "…", tool_calls=turn.tool_calls,
        input_tokens=turn.input_tokens, output_tokens=turn.output_tokens,
        created_at=now + timedelta(microseconds=1),
    )
    db.add(assistant_msg)
    if conv.title == "Nouvelle conversation":
        conv.title = body.content[:60]
    conv.updated_at = now
    await db.commit()

    pending = []
    if turn.pending_action_ids:
        ids = [uuid.UUID(i) for i in turn.pending_action_ids]
        pending = (await db.scalars(select(PendingAction).where(PendingAction.id.in_(ids)))).all()
    return ChatReply(
        user_message=MessageOut.model_validate(user_msg),
        assistant_message=MessageOut.model_validate(assistant_msg),
        pending_actions=[PendingActionOut.model_validate(p) for p in pending],
    )


@router.get("/pending-actions", response_model=list[PendingActionOut])
async def list_pending(user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    stmt = (
        select(PendingAction)
        .where(PendingAction.user_id == user.id, PendingAction.status == PendingStatus.pending,
               PendingAction.expires_at > datetime.now(timezone.utc))
        .order_by(PendingAction.created_at.desc())
    )
    return (await db.scalars(stmt)).all()


async def _resolve(action_id: uuid.UUID, user: User, db: AsyncSession, approve: bool) -> dict:
    pending = await db.get(PendingAction, action_id)
    if pending is None or pending.user_id != user.id:
        raise HTTPException(404, "Action introuvable")
    result = await resolve_pending_action(db, pending, user, approve)
    if result["status"] == "error":
        raise HTTPException(409, result["error"])
    return result


@router.post("/pending-actions/{action_id}/confirm")
async def confirm_pending(action_id: uuid.UUID, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    return await _resolve(action_id, user, db, approve=True)


@router.post("/pending-actions/{action_id}/reject")
async def reject_pending(action_id: uuid.UUID, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    return await _resolve(action_id, user, db, approve=False)
