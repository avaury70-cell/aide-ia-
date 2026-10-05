import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# --- Authentification ---------------------------------------------------------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    display_name: str = Field(min_length=1, max_length=100)
    role: Literal["admin", "member", "guest"] = "member"


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(ORM):
    id: uuid.UUID
    email: str
    display_name: str
    role: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class PushTokenIn(BaseModel):
    token: str
    platform: Literal["ios", "android", "web"]


# --- Maison ------------------------------------------------------------------
class RoomIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    floor: int | None = None
    icon: str | None = None


class RoomOut(ORM):
    id: uuid.UUID
    name: str
    floor: int | None
    icon: str | None


class DeviceOut(ORM):
    id: uuid.UUID
    entity_id: str
    name: str
    domain: str
    device_class: str | None
    room: RoomOut | None
    is_exposed: bool
    is_sensitive: bool
    state: str | None
    attributes: dict[str, Any]
    last_changed_at: datetime | None


class DeviceUpdate(BaseModel):
    name: str | None = None
    room_id: uuid.UUID | None = None
    is_exposed: bool | None = None
    is_sensitive: bool | None = None


class DeviceActionIn(BaseModel):
    action: str
    parameters: dict[str, Any] = Field(default_factory=dict)


class DeviceEventOut(ORM):
    old_state: str | None
    new_state: str | None
    occurred_at: datetime


# --- Conversation -------------------------------------------------------------
class ConversationOut(ORM):
    id: uuid.UUID
    title: str
    created_at: datetime
    updated_at: datetime


class MessageIn(BaseModel):
    content: str = Field(min_length=1, max_length=4000)


class MessageOut(ORM):
    id: uuid.UUID
    role: str
    content: str
    tool_calls: list[dict[str, Any]]
    created_at: datetime


class PendingActionOut(ORM):
    id: uuid.UUID
    entity_id: str
    action: str
    parameters: dict[str, Any]
    summary: str
    status: str
    expires_at: datetime


class ChatReply(BaseModel):
    user_message: MessageOut
    assistant_message: MessageOut
    pending_actions: list[PendingActionOut]


# --- Automatisations ------------------------------------------------------------
class AutomationIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str | None = None
    enabled: bool = True
    trigger: dict[str, Any]
    conditions: list[dict[str, Any]] = Field(default_factory=list)
    actions: list[dict[str, Any]]


class AutomationPatch(BaseModel):
    name: str | None = None
    description: str | None = None
    enabled: bool | None = None


class AutomationOut(ORM):
    id: uuid.UUID
    name: str
    description: str | None
    enabled: bool
    trigger: dict[str, Any]
    conditions: list[dict[str, Any]]
    actions: list[dict[str, Any]]
    created_by: str
    last_run_at: datetime | None
    created_at: datetime


class AutomationRunOut(ORM):
    id: int
    started_at: datetime
    status: str
    detail: dict[str, Any]


class MemoryOut(ORM):
    id: uuid.UUID
    category: str
    content: str
    user_id: uuid.UUID | None
    created_at: datetime
