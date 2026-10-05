"""Passerelle vers Home Assistant (REST pour les commandes, WebSocket pour les événements).

Home Assistant sert de couche d'abstraction matérielle : Zigbee, Z-Wave, Matter,
Wi-Fi (Shelly, Tuya…), etc. sont tous exposés comme des « entités » homogènes.
"""

import asyncio
import json
import logging
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Any, Protocol

import httpx
import websockets

from ..config import get_settings

log = logging.getLogger(__name__)


class HomeAssistantError(Exception):
    pass


# Actions génériques exposées à l'IA → (service HA, paramètres autorisés).
# Le domaine du service est celui de l'entité, sauf mention explicite "domaine.service".
ACTIONS: dict[str, dict[str, tuple[str, set[str]]]] = {
    "light": {
        "turn_on": ("turn_on", {"brightness_pct", "color_temp_kelvin", "rgb_color", "transition"}),
        "turn_off": ("turn_off", {"transition"}),
        "toggle": ("toggle", set()),
    },
    "switch": {"turn_on": ("turn_on", set()), "turn_off": ("turn_off", set()), "toggle": ("toggle", set())},
    "fan": {
        "turn_on": ("turn_on", {"percentage"}),
        "turn_off": ("turn_off", set()),
        "set_percentage": ("set_percentage", {"percentage"}),
    },
    "climate": {
        "set_temperature": ("set_temperature", {"temperature", "hvac_mode"}),
        "set_hvac_mode": ("set_hvac_mode", {"hvac_mode"}),
        "turn_on": ("turn_on", set()),
        "turn_off": ("turn_off", set()),
    },
    "cover": {
        "open": ("open_cover", set()),
        "close": ("close_cover", set()),
        "stop": ("stop_cover", set()),
        "set_position": ("set_cover_position", {"position"}),
    },
    "lock": {"lock": ("lock", set()), "unlock": ("unlock", {"code"})},
    "alarm_control_panel": {
        "arm_home": ("alarm_arm_home", {"code"}),
        "arm_away": ("alarm_arm_away", {"code"}),
        "arm_night": ("alarm_arm_night", {"code"}),
        "disarm": ("alarm_disarm", {"code"}),
    },
    "media_player": {
        "play": ("media_play", set()),
        "pause": ("media_pause", set()),
        "stop": ("media_stop", set()),
        "set_volume": ("volume_set", {"volume_level"}),
        "turn_on": ("turn_on", set()),
        "turn_off": ("turn_off", set()),
    },
    "vacuum": {"start": ("start", set()), "stop": ("stop", set()), "return_to_base": ("return_to_base", set())},
    "valve": {"open": ("open_valve", set()), "close": ("close_valve", set())},
    "scene": {"activate": ("turn_on", set())},
    "script": {"activate": ("turn_on", set())},
    "input_boolean": {"turn_on": ("turn_on", set()), "turn_off": ("turn_off", set())},
}


@dataclass
class ServiceCall:
    domain: str
    service: str
    data: dict[str, Any]


def resolve_action(entity_id: str, action: str, parameters: dict[str, Any] | None = None) -> ServiceCall:
    """Traduit une action générique en appel de service HA, en filtrant les paramètres."""
    domain = entity_id.split(".", 1)[0]
    domain_actions = ACTIONS.get(domain)
    if domain_actions is None:
        raise HomeAssistantError(f"Le domaine '{domain}' n'est pas pilotable")
    if action not in domain_actions:
        raise HomeAssistantError(
            f"Action '{action}' invalide pour {domain}. Actions possibles : {', '.join(domain_actions)}"
        )
    service, allowed = domain_actions[action]
    params = parameters or {}
    unknown = set(params) - allowed
    if unknown:
        raise HomeAssistantError(f"Paramètres non autorisés pour {action} : {', '.join(sorted(unknown))}")
    return ServiceCall(domain=domain, service=service, data={"entity_id": entity_id, **params})


class HomeClient(Protocol):
    async def get_states(self) -> list[dict[str, Any]]: ...
    async def get_state(self, entity_id: str) -> dict[str, Any]: ...
    async def call_service(self, call: ServiceCall) -> list[dict[str, Any]]: ...


class HomeAssistantClient:
    def __init__(self, base_url: str, token: str, timeout: float = 10.0) -> None:
        self._base_url = base_url.rstrip("/")
        self._token = token
        self._http = httpx.AsyncClient(
            base_url=self._base_url,
            headers={"Authorization": f"Bearer {token}"},
            timeout=timeout,
        )

    async def close(self) -> None:
        await self._http.aclose()

    async def _request(self, method: str, path: str, **kwargs: Any) -> Any:
        if not self._token:
            raise HomeAssistantError("HA_TOKEN non configuré (jeton d'accès longue durée Home Assistant)")
        try:
            resp = await self._http.request(method, path, **kwargs)
        except httpx.HTTPError as exc:
            raise HomeAssistantError(f"Home Assistant injoignable : {exc}") from exc
        if resp.status_code == 404:
            raise HomeAssistantError("Entité ou service introuvable")
        if resp.status_code >= 400:
            raise HomeAssistantError(f"Erreur Home Assistant {resp.status_code} : {resp.text[:200]}")
        return resp.json()

    async def get_states(self) -> list[dict[str, Any]]:
        return await self._request("GET", "/api/states")

    async def get_state(self, entity_id: str) -> dict[str, Any]:
        return await self._request("GET", f"/api/states/{entity_id}")

    async def call_service(self, call: ServiceCall) -> list[dict[str, Any]]:
        return await self._request("POST", f"/api/services/{call.domain}/{call.service}", json=call.data)

    async def listen_state_changes(
        self, on_change: Callable[[dict[str, Any]], Awaitable[None]], stop: asyncio.Event
    ) -> None:
        """Écoute `state_changed` via l'API WebSocket, avec reconnexion exponentielle."""
        ws_url = self._base_url.replace("http", "ws", 1) + "/api/websocket"
        delay = 1.0
        while not stop.is_set():
            try:
                async with websockets.connect(ws_url, max_size=2**24) as ws:
                    await self._ws_handshake(ws)
                    await ws.send(json.dumps({"id": 1, "type": "subscribe_events", "event_type": "state_changed"}))
                    delay = 1.0
                    log.info("Abonné aux événements Home Assistant")
                    async for raw in ws:
                        msg = json.loads(raw)
                        if msg.get("type") == "event":
                            try:
                                await on_change(msg["event"]["data"])
                            except Exception:  # un handler défaillant ne doit pas couper le flux
                                log.exception("Erreur de traitement d'un événement HA")
            except (OSError, websockets.WebSocketException, HomeAssistantError) as exc:
                log.warning("WebSocket HA interrompu (%s), reconnexion dans %.0fs", exc, delay)
            try:
                await asyncio.wait_for(stop.wait(), timeout=delay)
            except TimeoutError:
                pass
            delay = min(delay * 2, 60)

    async def _ws_handshake(self, ws: Any) -> None:
        if not self._token:
            raise HomeAssistantError("HA_TOKEN non configuré")
        hello = json.loads(await ws.recv())
        if hello.get("type") != "auth_required":
            raise HomeAssistantError(f"Handshake inattendu : {hello}")
        await ws.send(json.dumps({"type": "auth", "access_token": self._token}))
        result = json.loads(await ws.recv())
        if result.get("type") != "auth_ok":
            raise HomeAssistantError("Jeton Home Assistant refusé")


_client: HomeClient | None = None


def get_home_client() -> HomeClient:
    global _client
    if _client is None:
        s = get_settings()
        if s.demo_mode:
            from .demo_home import DemoHome

            _client = DemoHome()
        else:
            _client = HomeAssistantClient(s.ha_url, s.ha_token)
    return _client


def set_home_client(client: HomeClient | None) -> None:
    """Injection d'un client (tests ou simulateur)."""
    global _client
    _client = client
