import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import auth, automations, chat, devices, memories, voice, ws
from .config import get_settings
from .db import SessionLocal, init_models
from .services.automations import AutomationEngine
from .services.home import record_state_change, sync_devices
from .services.demo_home import assign_demo_rooms
from .services.homeassistant import HomeAssistantError, get_home_client

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("aide")


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    if settings.database_url.startswith("sqlite"):
        await init_models()

    engine = AutomationEngine(SessionLocal)
    stop = asyncio.Event()
    tasks = [asyncio.create_task(engine.run_scheduler(stop), name="automation-scheduler")]

    client = get_home_client()
    if settings.demo_mode:
        log.info("MODE DÉMO : maison simulée, aucun Home Assistant requis")
    if settings.ha_listener_enabled and hasattr(client, "listen_state_changes"):
        try:
            async with SessionLocal() as db:
                created = await sync_devices(db)
                if settings.demo_mode:
                    await assign_demo_rooms(db)
            log.info("Inventaire de la maison synchronisé (%d nouvelles entités)", created)
        except HomeAssistantError as exc:
            log.warning("Synchronisation initiale impossible : %s", exc)

        async def on_change(data: dict[str, Any]) -> None:
            async with SessionLocal() as db:
                if await record_state_change(db, data) is not None:
                    await engine.on_state_change(db, data)

        tasks.append(asyncio.create_task(client.listen_state_changes(on_change, stop), name="ha-listener"))

    yield

    stop.set()
    for task in tasks:  # le listener HA peut être bloqué en lecture WebSocket
        task.cancel()
    await asyncio.gather(*tasks, return_exceptions=True)


app = FastAPI(title="Aide — assistant domestique", version="1.0.0", lifespan=lifespan)
if get_settings().cors_origins:
    app.add_middleware(
        CORSMiddleware, allow_origins=get_settings().cors_origins, allow_methods=["*"], allow_headers=["*"]
    )
for r in (auth.router, devices.router, chat.router, automations.router, memories.router, voice.router, ws.router):
    app.include_router(r)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
