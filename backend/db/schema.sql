-- Schéma de référence PostgreSQL 16 — assistant domestique « Aide ».
-- Chargé automatiquement par le conteneur `db` (docker-entrypoint-initdb.d).
-- Doit rester synchronisé avec app/models.py.

BEGIN;

CREATE TYPE user_role      AS ENUM ('admin', 'member', 'guest');
CREATE TYPE actor          AS ENUM ('user', 'assistant', 'automation', 'system');
CREATE TYPE pending_status AS ENUM ('pending', 'confirmed', 'rejected', 'expired', 'failed');

-- Habitants et invités ---------------------------------------------------------
CREATE TABLE users (
    id            UUID PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,          -- scrypt$sel$empreinte
    display_name  VARCHAR(100) NOT NULL,
    role          user_role    NOT NULL DEFAULT 'member',
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE push_tokens (
    id         UUID PRIMARY KEY,
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token      VARCHAR(255) NOT NULL UNIQUE,      -- ExponentPushToken[...]
    platform   VARCHAR(20)  NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX ix_push_tokens_user_id ON push_tokens(user_id);

-- Inventaire de la maison ---------------------------------------------------------
CREATE TABLE rooms (
    id    UUID PRIMARY KEY,
    name  VARCHAR(100) NOT NULL UNIQUE,
    floor INTEGER,
    icon  VARCHAR(50)
);

CREATE TABLE devices (
    id              UUID PRIMARY KEY,
    entity_id       VARCHAR(255) NOT NULL UNIQUE,  -- ex. light.salon (Home Assistant)
    name            VARCHAR(255) NOT NULL,
    domain          VARCHAR(50)  NOT NULL,         -- light, switch, climate, lock…
    device_class    VARCHAR(50),
    room_id         UUID REFERENCES rooms(id) ON DELETE SET NULL,
    is_exposed      BOOLEAN NOT NULL DEFAULT TRUE, -- visible/pilotable par l'IA
    is_sensitive    BOOLEAN NOT NULL DEFAULT FALSE,-- confirmation humaine obligatoire
    state           VARCHAR(255),
    attributes      JSONB   NOT NULL DEFAULT '{}',
    last_changed_at TIMESTAMPTZ
);
CREATE INDEX ix_devices_domain ON devices(domain);

-- Historique des états (volumineux : purge/partitionnement mensuel recommandé).
CREATE TABLE device_events (
    id          BIGSERIAL PRIMARY KEY,
    entity_id   VARCHAR(255) NOT NULL,
    old_state   VARCHAR(255),
    new_state   VARCHAR(255),
    attributes  JSONB       NOT NULL DEFAULT '{}',
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_device_events_entity_time ON device_events(entity_id, occurred_at);

-- Conversations avec l'assistant --------------------------------------------------
CREATE TABLE conversations (
    id         UUID PRIMARY KEY,
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      VARCHAR(200) NOT NULL DEFAULT 'Nouvelle conversation',
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX ix_conversations_user_id ON conversations(user_id);

CREATE TABLE messages (
    id              UUID PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role            VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content         TEXT        NOT NULL,
    tool_calls      JSONB       NOT NULL DEFAULT '[]',
    input_tokens    INTEGER,
    output_tokens   INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_messages_conversation_time ON messages(conversation_id, created_at);

-- Mémoire à long terme (user_id NULL = partagée par le foyer).
CREATE TABLE memories (
    id           UUID PRIMARY KEY,
    user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
    category     VARCHAR(50) NOT NULL DEFAULT 'general',
    content      TEXT        NOT NULL,
    source       actor       NOT NULL DEFAULT 'assistant',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_used_at TIMESTAMPTZ
);
CREATE INDEX ix_memories_user_id ON memories(user_id);

-- Actions sensibles proposées par l'IA, en attente de validation.
CREATE TABLE pending_actions (
    id              UUID PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    entity_id       VARCHAR(255) NOT NULL,
    action          VARCHAR(100) NOT NULL,
    parameters      JSONB          NOT NULL DEFAULT '{}',
    summary         TEXT           NOT NULL,
    status          pending_status NOT NULL DEFAULT 'pending',
    expires_at      TIMESTAMPTZ    NOT NULL,
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT now(),
    resolved_at     TIMESTAMPTZ
);
CREATE INDEX ix_pending_actions_user_id ON pending_actions(user_id);

-- Automatisations -------------------------------------------------------------------
CREATE TABLE automations (
    id          UUID PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    description TEXT,
    enabled     BOOLEAN NOT NULL DEFAULT TRUE,
    trigger     JSONB   NOT NULL,                  -- {"type":"time","cron":...} | {"type":"state",...}
    conditions  JSONB   NOT NULL DEFAULT '[]',
    actions     JSONB   NOT NULL,
    created_by  actor   NOT NULL DEFAULT 'user',
    owner_id    UUID REFERENCES users(id) ON DELETE SET NULL,
    last_run_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Accélère la recherche des automatisations déclenchées par une entité donnée.
CREATE INDEX ix_automations_state_trigger ON automations ((trigger->>'entity_id')) WHERE enabled;

CREATE TABLE automation_runs (
    id            BIGSERIAL PRIMARY KEY,
    automation_id UUID NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
    started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    status        VARCHAR(20) NOT NULL,            -- success | skipped | error
    detail        JSONB       NOT NULL DEFAULT '{}'
);
CREATE INDEX ix_automation_runs_automation_id ON automation_runs(automation_id);

-- Journal d'audit (append-only) -------------------------------------------------------
CREATE TABLE audit_log (
    id         BIGSERIAL PRIMARY KEY,
    user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
    actor      actor        NOT NULL,
    action     VARCHAR(100) NOT NULL,              -- ex. light.turn_on
    target     VARCHAR(255),
    payload    JSONB        NOT NULL DEFAULT '{}',
    success    BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX ix_audit_log_time ON audit_log(created_at);

COMMIT;
