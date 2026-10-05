"""Modèle de données ORM. Miroir de `db/schema.sql` (référence PostgreSQL)."""

import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    JSON,
    BigInteger,
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base

# JSONB sous PostgreSQL, JSON ailleurs (SQLite pour les tests).
JsonType = JSON().with_variant(JSONB(), "postgresql")
# BIGSERIAL sous PostgreSQL ; SQLite n'auto-incrémente que INTEGER PRIMARY KEY.
BigIntPK = BigInteger().with_variant(Integer(), "sqlite")


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class UserRole(str, enum.Enum):
    admin = "admin"
    member = "member"
    guest = "guest"


class Actor(str, enum.Enum):
    user = "user"
    assistant = "assistant"
    automation = "automation"
    system = "system"


class PendingStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    rejected = "rejected"
    expired = "expired"
    failed = "failed"


def _enum(e: type[enum.Enum], name: str) -> Enum:
    return Enum(e, name=name, values_callable=lambda x: [m.value for m in x])


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    display_name: Mapped[str] = mapped_column(String(100))
    role: Mapped[UserRole] = mapped_column(_enum(UserRole, "user_role"), default=UserRole.member)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Room(Base):
    __tablename__ = "rooms"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    floor: Mapped[int | None] = mapped_column(Integer)
    icon: Mapped[str | None] = mapped_column(String(50))

    devices: Mapped[list["Device"]] = relationship(back_populates="room")


class Device(Base):
    """Entité Home Assistant connue de l'assistant (lumière, prise, capteur…)."""

    __tablename__ = "devices"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    entity_id: Mapped[str] = mapped_column(String(255), unique=True)
    name: Mapped[str] = mapped_column(String(255))
    domain: Mapped[str] = mapped_column(String(50), index=True)
    device_class: Mapped[str | None] = mapped_column(String(50))
    room_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("rooms.id", ondelete="SET NULL"))
    # Exposé à l'IA : l'assistant ne voit ni ne pilote les entités non exposées.
    is_exposed: Mapped[bool] = mapped_column(Boolean, default=True)
    # Sensible : toute commande nécessite une confirmation dans l'application.
    is_sensitive: Mapped[bool] = mapped_column(Boolean, default=False)
    state: Mapped[str | None] = mapped_column(String(255))
    attributes: Mapped[dict] = mapped_column(JsonType, default=dict)
    last_changed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    room: Mapped[Room | None] = relationship(back_populates="devices", lazy="selectin")


class DeviceEvent(Base):
    """Historique des changements d'état (table volumineuse, à partitionner/purger)."""

    __tablename__ = "device_events"
    __table_args__ = (Index("ix_device_events_entity_time", "entity_id", "occurred_at"),)

    id: Mapped[int] = mapped_column(BigIntPK, primary_key=True, autoincrement=True)
    entity_id: Mapped[str] = mapped_column(String(255))
    old_state: Mapped[str | None] = mapped_column(String(255))
    new_state: Mapped[str | None] = mapped_column(String(255))
    attributes: Mapped[dict] = mapped_column(JsonType, default=dict)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(200), default="Nouvelle conversation")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    messages: Mapped[list["Message"]] = relationship(
        back_populates="conversation", order_by="Message.created_at", cascade="all, delete-orphan"
    )


class Message(Base):
    __tablename__ = "messages"
    __table_args__ = (Index("ix_messages_conversation_time", "conversation_id", "created_at"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    conversation_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("conversations.id", ondelete="CASCADE"))
    role: Mapped[str] = mapped_column(String(20))  # "user" | "assistant"
    content: Mapped[str] = mapped_column(Text)
    # Trace des outils appelés pendant le tour (affichage + audit).
    tool_calls: Mapped[list] = mapped_column(JsonType, default=list)
    input_tokens: Mapped[int | None] = mapped_column(Integer)
    output_tokens: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    conversation: Mapped[Conversation] = relationship(back_populates="messages")


class Memory(Base):
    """Faits durables (préférences, habitudes) que l'assistant mémorise."""

    __tablename__ = "memories"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    # NULL = mémoire partagée par tout le foyer.
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    category: Mapped[str] = mapped_column(String(50), default="general")
    content: Mapped[str] = mapped_column(Text)
    source: Mapped[Actor] = mapped_column(_enum(Actor, "actor"), default=Actor.assistant)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Automation(Base):
    """Règle « déclencheur → conditions → actions », créée par l'utilisateur ou par l'IA."""

    __tablename__ = "automations"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    # {"type": "time", "cron": "30 7 * * 1-5"} | {"type": "state", "entity_id": ..., "to": ...}
    trigger: Mapped[dict] = mapped_column(JsonType)
    # [{"entity_id": ..., "state": ...}] — toutes doivent être vraies.
    conditions: Mapped[list] = mapped_column(JsonType, default=list)
    # [{"type": "device", "entity_id", "action", "parameters"} | {"type": "notify", "message"}]
    actions: Mapped[list] = mapped_column(JsonType)
    created_by: Mapped[Actor] = mapped_column(_enum(Actor, "actor"), default=Actor.user)
    owner_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    last_run_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    runs: Mapped[list["AutomationRun"]] = relationship(
        back_populates="automation", cascade="all, delete-orphan", order_by="AutomationRun.started_at.desc()"
    )


class AutomationRun(Base):
    __tablename__ = "automation_runs"

    id: Mapped[int] = mapped_column(BigIntPK, primary_key=True, autoincrement=True)
    automation_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("automations.id", ondelete="CASCADE"), index=True
    )
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    status: Mapped[str] = mapped_column(String(20))  # success | skipped | error
    detail: Mapped[dict] = mapped_column(JsonType, default=dict)

    automation: Mapped[Automation] = relationship(back_populates="runs")


class PendingAction(Base):
    """Commande sensible proposée par l'IA, en attente de validation humaine."""

    __tablename__ = "pending_actions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    conversation_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("conversations.id", ondelete="SET NULL")
    )
    entity_id: Mapped[str] = mapped_column(String(255))
    action: Mapped[str] = mapped_column(String(100))
    parameters: Mapped[dict] = mapped_column(JsonType, default=dict)
    summary: Mapped[str] = mapped_column(Text)
    status: Mapped[PendingStatus] = mapped_column(
        _enum(PendingStatus, "pending_status"), default=PendingStatus.pending
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class PushToken(Base):
    __tablename__ = "push_tokens"
    __table_args__ = (UniqueConstraint("token"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    token: Mapped[str] = mapped_column(String(255))
    platform: Mapped[str] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class AuditLog(Base):
    """Journal immuable de toute action exécutée sur la maison."""

    __tablename__ = "audit_log"
    __table_args__ = (Index("ix_audit_log_time", "created_at"),)

    id: Mapped[int] = mapped_column(BigIntPK, primary_key=True, autoincrement=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    actor: Mapped[Actor] = mapped_column(_enum(Actor, "actor"))
    action: Mapped[str] = mapped_column(String(100))
    target: Mapped[str | None] = mapped_column(String(255))
    payload: Mapped[dict] = mapped_column(JsonType, default=dict)
    success: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
