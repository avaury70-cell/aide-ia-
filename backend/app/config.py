from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite+aiosqlite:///./aide.db"
    jwt_secret: str = "dev-secret-change-me"
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

    home_timezone: str = "Europe/Paris"
    # Domaines dont les actions exigent une confirmation explicite de l'utilisateur.
    sensitive_domains: tuple[str, ...] = ("lock", "alarm_control_panel", "cover", "valve")
    pending_action_ttl_seconds: int = 300

    automation_tick_seconds: int = 30

    # Origines autorisées (CORS) — utile uniquement pour la version web de l'app en développement.
    cors_origins: list[str] = []


@lru_cache
def get_settings() -> Settings:
    return Settings()
