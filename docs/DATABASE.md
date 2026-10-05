# Schéma de base de données

Référence exécutable : [`backend/db/schema.sql`](../backend/db/schema.sql) (PostgreSQL 16).
Le modèle ORM [`backend/app/models.py`](../backend/app/models.py) en est le miroir exact.

## Diagramme entité-relation

```mermaid
erDiagram
    users ||--o{ conversations : "possède"
    users ||--o{ memories : "souvenirs personnels"
    users ||--o{ pending_actions : "doit valider"
    users ||--o{ push_tokens : "appareils mobiles"
    users ||--o{ automations : "propriétaire"
    users ||--o{ audit_log : "auteur"
    conversations ||--o{ messages : "contient"
    conversations ||--o{ pending_actions : "origine"
    rooms ||--o{ devices : "regroupe"
    devices ||--o{ device_events : "historique (par entity_id)"
    automations ||--o{ automation_runs : "exécutions"

    users {
        uuid id PK
        varchar email UK
        varchar password_hash
        varchar display_name
        user_role role "admin | member | guest"
        timestamptz created_at
    }
    rooms {
        uuid id PK
        varchar name UK
        int floor
        varchar icon
    }
    devices {
        uuid id PK
        varchar entity_id UK "light.salon"
        varchar name
        varchar domain
        varchar device_class
        uuid room_id FK
        bool is_exposed "visible par l'IA"
        bool is_sensitive "confirmation requise"
        varchar state
        jsonb attributes
        timestamptz last_changed_at
    }
    device_events {
        bigserial id PK
        varchar entity_id
        varchar old_state
        varchar new_state
        jsonb attributes
        timestamptz occurred_at
    }
    conversations {
        uuid id PK
        uuid user_id FK
        varchar title
        timestamptz updated_at
    }
    messages {
        uuid id PK
        uuid conversation_id FK
        varchar role "user | assistant"
        text content
        jsonb tool_calls
        int input_tokens
        int output_tokens
        timestamptz created_at
    }
    memories {
        uuid id PK
        uuid user_id FK "NULL = foyer"
        varchar category
        text content
        actor source
        timestamptz last_used_at
    }
    pending_actions {
        uuid id PK
        uuid user_id FK
        uuid conversation_id FK
        varchar entity_id
        varchar action
        jsonb parameters
        text summary
        pending_status status
        timestamptz expires_at
    }
    automations {
        uuid id PK
        varchar name
        bool enabled
        jsonb trigger
        jsonb conditions
        jsonb actions
        actor created_by
        uuid owner_id FK
        timestamptz last_run_at
    }
    automation_runs {
        bigserial id PK
        uuid automation_id FK
        timestamptz started_at
        varchar status
        jsonb detail
    }
    push_tokens {
        uuid id PK
        uuid user_id FK
        varchar token UK
        varchar platform
    }
    audit_log {
        bigserial id PK
        uuid user_id FK
        actor actor
        varchar action "light.turn_on"
        varchar target
        jsonb payload
        bool success
        timestamptz created_at
    }
```

## Tables

| Table | Rôle | Volume attendu |
|---|---|---|
| `users` | Habitants et invités, rôle `admin` / `member` / `guest` | Quelques lignes |
| `push_tokens` | Jetons Expo Push par téléphone | Quelques lignes |
| `rooms` | Pièces (organisation de l'app et filtre `list_devices`) | ~10–30 |
| `devices` | Miroir des entités HA utiles + réglages propres à l'assistant | ~50–500 |
| `device_events` | Historique des changements d'état | **Élevé** : 10⁴–10⁵ / jour |
| `conversations` / `messages` | Historique conversationnel + trace des outils + tokens consommés | Modéré |
| `memories` | Préférences et habitudes durables | ~10–500 |
| `pending_actions` | Commandes sensibles en attente (TTL 5 min) | Faible |
| `automations` / `automation_runs` | Routines et journal d'exécution | Faible / modéré |
| `audit_log` | Journal append-only de toute action physique | Modéré |

## Formats JSONB

**`automations.trigger`**
```json
{"type": "time",  "cron": "30 7 * * 1-5"}
{"type": "state", "entity_id": "binary_sensor.porte_garage", "to": "on", "from": "off"}
```

**`automations.conditions`** — toutes doivent être vraies au moment du déclenchement
```json
[{"entity_id": "person.alex", "state": "not_home"}]
```

**`automations.actions`** — exécutées dans l'ordre
```json
[
  {"type": "device", "entity_id": "light.salon", "action": "turn_on", "parameters": {"brightness_pct": 30}},
  {"type": "notify", "message": "La porte du garage est restée ouverte"}
]
```

**`messages.tool_calls`**
```json
[{"name": "control_device", "input": {"entity_id": "light.salon", "action": "turn_off"}, "is_error": false}]
```

## Choix de conception

* **UUID** pour les entités exposées dans l'API (non devinables), **BIGSERIAL** pour les journaux
  volumineux (`device_events`, `automation_runs`, `audit_log`).
* **`device_events` référence `entity_id` sans clé étrangère** : l'historique survit à la
  suppression d'un appareil, et l'insertion à haut débit n'est pas ralentie par la contrainte.
* **États dupliqués dans `devices`** : l'agent lit l'état depuis PostgreSQL (mis à jour en continu par
  le WebSocket HA) plutôt que d'interroger HA à chaque outil.
* **Index d'expression** `automations ((trigger->>'entity_id')) WHERE enabled` pour retrouver vite les
  règles concernées par un événement.
* **Rétention** : purger `device_events` au-delà de 90 jours (tâche cron
  `DELETE FROM device_events WHERE occurred_at < now() - interval '90 days'`) ou partitionner par mois.
* **RGPD / vie privée** : les souvenirs sont consultables et supprimables depuis l'app ; la
  suppression d'un utilisateur supprime en cascade ses conversations, souvenirs et jetons.
