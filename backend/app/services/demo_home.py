"""Maison simulée (DEMO_MODE=true) : essayer Aide sans Home Assistant ni objet connecté.

Les commandes modifient réellement l'état simulé et produisent les mêmes événements
`state_changed` qu'une vraie installation : l'interface se met à jour en direct.
"""

import asyncio
import copy
import random
from datetime import datetime, timezone
from typing import Any, Awaitable, Callable

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Device, Room
from .homeassistant import HomeAssistantError, ServiceCall

# entity_id → (nom, pièce, état initial, attributs)
DEMO_DEVICES: dict[str, tuple[str, str, str, dict[str, Any]]] = {
    "light.salon": ("Plafonnier du salon", "Salon", "on", {"brightness": 180}),
    "light.lampadaire": ("Lampadaire", "Salon", "off", {}),
    "cover.volet_salon": ("Volet du salon", "Salon", "open", {"current_position": 100}),
    "media_player.enceinte": ("Enceinte du salon", "Salon", "paused", {"volume_level": 0.3}),
    "climate.thermostat": ("Thermostat", "Salon", "heat", {"current_temperature": 20.5, "temperature": 21}),
    "sensor.temperature_salon": ("Température du salon", "Salon", "20.5",
                                 {"device_class": "temperature", "unit_of_measurement": "°C"}),
    "sensor.humidite_salon": ("Humidité du salon", "Salon", "48",
                              {"device_class": "humidity", "unit_of_measurement": "%"}),
    "scene.cinema": ("Mode cinéma", "Salon", "scening", {}),
    "light.cuisine": ("Lumière de la cuisine", "Cuisine", "off", {}),
    "switch.machine_cafe": ("Machine à café", "Cuisine", "off", {}),
    "light.chambre": ("Lampe de chevet", "Chambre", "off", {}),
    "cover.volet_chambre": ("Volet de la chambre", "Chambre", "closed", {"current_position": 0}),
    "light.bureau": ("Lampe du bureau", "Bureau", "on", {"brightness": 120}),
    "switch.ordinateur": ("Prise de l'ordinateur", "Bureau", "on", {}),
    "lock.porte_entree": ("Porte d'entrée", "Entrée", "locked", {}),
    "binary_sensor.porte_garage": ("Porte du garage", "Entrée", "off", {"device_class": "garage_door"}),
}


class DemoHome:
    def __init__(self) -> None:
        now = datetime.now(timezone.utc).isoformat()
        self._states: dict[str, dict[str, Any]] = {
            eid: {"entity_id": eid, "state": state, "attributes": {"friendly_name": name, **attrs},
                  "last_changed": now}
            for eid, (name, _room, state, attrs) in DEMO_DEVICES.items()
        }
        self._events: asyncio.Queue[dict[str, Any]] = asyncio.Queue()

    async def get_states(self) -> list[dict[str, Any]]:
        return copy.deepcopy(list(self._states.values()))

    async def get_state(self, entity_id: str) -> dict[str, Any]:
        if entity_id not in self._states:
            raise HomeAssistantError("Entité ou service introuvable")
        return copy.deepcopy(self._states[entity_id])

    def _set(self, entity_id: str, state: str | None = None, **attrs: Any) -> None:
        old = copy.deepcopy(self._states[entity_id])
        new = self._states[entity_id]
        if state is not None:
            new["state"] = state
        new["attributes"].update(attrs)
        new["last_changed"] = datetime.now(timezone.utc).isoformat()
        self._events.put_nowait({"entity_id": entity_id, "old_state": old, "new_state": copy.deepcopy(new)})

    async def call_service(self, call: ServiceCall) -> list[dict[str, Any]]:
        eid = call.data["entity_id"]
        if eid not in self._states:
            raise HomeAssistantError("Entité ou service introuvable")
        d, s = call.domain, call.service
        current = self._states[eid]["state"]
        if s == "turn_on" and d == "scene":
            if eid == "scene.cinema":
                self._set("light.salon", "on", brightness=40)
                self._set("light.lampadaire", "off")
                self._set("cover.volet_salon", "closed", current_position=0)
                self._set("media_player.enceinte", "playing")
        elif s == "turn_on":
            attrs = {}
            if "brightness_pct" in call.data:
                attrs["brightness"] = round(int(call.data["brightness_pct"]) * 255 / 100)
            elif d == "light" and current != "on":
                attrs["brightness"] = 255
            self._set(eid, "heat" if d == "climate" else "on", **attrs)
        elif s == "turn_off":
            self._set(eid, "off")
        elif s == "toggle":
            self._set(eid, "off" if current == "on" else "on")
        elif s == "open_cover":
            self._set(eid, "open", current_position=100)
        elif s == "close_cover":
            self._set(eid, "closed", current_position=0)
        elif s == "set_cover_position":
            pos = int(call.data.get("position", 0))
            self._set(eid, "open" if pos > 0 else "closed", current_position=pos)
        elif s in ("lock", "unlock"):
            self._set(eid, "locked" if s == "lock" else "unlocked")
        elif s == "set_temperature":
            self._set(eid, call.data.get("hvac_mode"), temperature=call.data["temperature"])
        elif s == "set_hvac_mode":
            self._set(eid, call.data["hvac_mode"])
        elif s in ("media_play", "media_pause", "media_stop"):
            self._set(eid, {"media_play": "playing", "media_pause": "paused", "media_stop": "idle"}[s])
        elif s == "volume_set":
            self._set(eid, None, volume_level=call.data["volume_level"])
        return []

    async def listen_state_changes(
        self, on_change: Callable[[dict[str, Any]], Awaitable[None]], stop: asyncio.Event
    ) -> None:
        last_drift = asyncio.get_running_loop().time()
        while not stop.is_set():
            try:
                event = await asyncio.wait_for(self._events.get(), timeout=5)
                await on_change(event)
            except TimeoutError:
                pass
            # Les capteurs évoluent doucement pour rendre la démo vivante.
            if asyncio.get_running_loop().time() - last_drift > 120:
                last_drift = asyncio.get_running_loop().time()
                t = round(float(self._states["sensor.temperature_salon"]["state"]) + random.uniform(-0.3, 0.3), 1)
                self._set("sensor.temperature_salon", str(t))
                self._set("climate.thermostat", None, current_temperature=t)


async def assign_demo_rooms(db: AsyncSession) -> None:
    """Crée les pièces de la démo et y range les appareils (sans écraser un choix existant)."""
    rooms = {r.name: r for r in (await db.scalars(select(Room))).all()}
    for name in dict.fromkeys(room for _n, room, _s, _a in DEMO_DEVICES.values()):
        if name not in rooms:
            rooms[name] = Room(name=name)
            db.add(rooms[name])
    await db.flush()
    for device in (await db.scalars(select(Device).where(Device.entity_id.in_(DEMO_DEVICES)))).all():
        if device.room_id is None:
            device.room_id = rooms[DEMO_DEVICES[device.entity_id][1]].id
    await db.commit()
