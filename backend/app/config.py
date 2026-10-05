from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite+aiosqlite:///./aide.db"
    # Laisser vide : une clé aléatoire est générée et conservée dans data_dir au premier démarrage.
    jwt_secret: str = ""
    data_dir: str = "./data"
    jwt_ttl_minutes: int = 60 * 24 * 7

    anthropic_api_key: str | None = None
    claude_model: str = "claude-opus-5-5"
    # Effort de raisonnement : "low" suffit aux commandes simples, "medium"/"high"
    # pour la planification d'automatisations complexes.
    claude_effort: str = "medium"
    claude_max_tool_iterations: int = 8

    ha_url: str = "http://homeassistant.local:8123"
    ha_token: str = ""
    # Désactive l'écoute WebSocket Home Assistant (tests, développement hors ligne).
    ha_listener_enabled: bool = True
    # Maison simulée : permet d'essayer Aide sans Home Assistant ni objet connecté.
    demo_mode: bool = False

    home_timezone: str = "Europe/Paris"
    # Domaines dont les actions exigent une confirmation explicite de l'utilisateur.
    sensitive_domains: tuple[str, ...] = ("lock", "alarm_control_panel", "cover", "valve")
    pending_action_ttl_seconds: int = 300

    automation_tick_seconds: int = 30

    # Transcription vocale locale (faster-whisper). "small" : bon compromis qualité/CPU en français.
    whisper_model: str = "small"
    whisper_device: str = "cpu"
    whisper_compute_type: str = "int8"
    voice_max_bytes: int = 10 * 1024 * 1024

    # Origines autorisées (CORS) — uniquement pour ouvrir l'interface dans un navigateur.
    # L'application de bureau passe par le processus principal Electron et n'en a pas besoin.
    cors_origins: list[str] = []


@lru_cache
def get_settings() -> Settings:
    return Settings()
