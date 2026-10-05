import os
import tempfile
from types import SimpleNamespace
from typing import Any

_db_file = os.path.join(tempfile.mkdtemp(), "test.db")
os.environ.setdefault("DATABASE_URL", f"sqlite+aiosqlite:///{_db_file}")
os.environ["HA_LISTENER_ENABLED"] = "false"
os.environ["JWT_SECRET"] = "test-secret-0123456789abcdef0123456789"

import httpx  # noqa: E402
import pytest  # noqa: E402

from app.db import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.services import assistant, homeassistant  # noqa: E402
from app.services.homeassistant import HomeAssistantError, ServiceCall  # noqa: E402


class FakeHome:
    """Simulateur Home Assistant en mémoire."""

    def __init__(self) -> None:
        self.calls: list[ServiceCall] = []
        self.states: dict[str, dict[str, Any]] = {}
        for eid, state, name in [
            ("light.salon", "off", "Lumière salon"),
            ("light.cuisine", "on", "Lumière cuisine"),
            ("lock.porte_entree", "locked", "Porte d'entrée"),
            ("climate.thermostat", "heat", "Thermostat"),
            ("binary_sensor.porte_garage", "off", "Porte du garage"),
            ("sensor.temperature_salon", "20.5", "Température salon"),
            ("sun.sun", "above_horizon", "Soleil"),
        ]:
            self.states[eid] = {"entity_id": eid, "state": state, "attributes": {"friendly_name": name},
                                "last_changed": "2026-10-05T08:00:00+00:00"}

    async def get_states(self) -> list[dict[str, Any]]:
        return list(self.states.values())

    async def get_state(self, entity_id: str) -> dict[str, Any]:
        if entity_id not in self.states:
            raise HomeAssistantError("Entité ou service introuvable")
        return self.states[entity_id]

    async def call_service(self, call: ServiceCall) -> list[dict[str, Any]]:
        self.calls.append(call)
        return []


def text_block(text: str) -> SimpleNamespace:
    return SimpleNamespace(type="text", text=text)


def tool_block(name: str, inp: dict[str, Any], id: str = "toolu_1") -> SimpleNamespace:
    return SimpleNamespace(type="tool_use", id=id, name=name, input=inp)


def response(stop_reason: str, *blocks: SimpleNamespace) -> SimpleNamespace:
    return SimpleNamespace(stop_reason=stop_reason, content=list(blocks),
                           usage=SimpleNamespace(input_tokens=10, output_tokens=5))


class FakeLLM:
    """Client Anthropic factice rejouant des réponses scriptées."""

    def __init__(self) -> None:
        self.script: list[SimpleNamespace] = []
        self.requests: list[dict[str, Any]] = []
        self.beta = SimpleNamespace(messages=SimpleNamespace(create=self._create))

    async def _create(self, **kwargs: Any) -> SimpleNamespace:
        self.requests.append(kwargs)
        return self.script.pop(0)


@pytest.fixture
async def db_reset():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Les connexions du pool sont liées à la boucle asyncio du test courant.
    await engine.dispose()


@pytest.fixture
def home(db_reset) -> FakeHome:
    fake = FakeHome()
    homeassistant.set_home_client(fake)
    yield fake
    homeassistant.set_home_client(None)


@pytest.fixture
def llm() -> FakeLLM:
    fake = FakeLLM()
    assistant.set_llm_client(fake)
    yield fake
    assistant.set_llm_client(None)


@pytest.fixture
async def client(home) -> httpx.AsyncClient:
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as c:
        yield c


@pytest.fixture
async def admin(client) -> dict[str, str]:
    r = await client.post("/auth/register", json={"email": "admin@maison.fr", "password": "motdepasse",
                                                  "display_name": "Alex"})
    assert r.status_code == 201, r.text
    headers = {"Authorization": f"Bearer {r.json()['access_token']}"}
    r = await client.post("/devices/sync", headers=headers)
    assert r.status_code == 200, r.text
    return headers


@pytest.fixture
def session():
    return SessionLocal
