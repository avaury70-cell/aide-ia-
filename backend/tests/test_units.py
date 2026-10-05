from datetime import datetime, timezone
from zoneinfo import ZoneInfo

import pytest

from app.security import hash_password, verify_password
from app.services.automations import cron_is_due, state_trigger_matches
from app.services.homeassistant import HomeAssistantError, resolve_action

PARIS = ZoneInfo("Europe/Paris")


def test_resolve_action_maps_generic_actions():
    call = resolve_action("cover.volet_salon", "set_position", {"position": 30})
    assert (call.domain, call.service, call.data) == (
        "cover", "set_cover_position", {"entity_id": "cover.volet_salon", "position": 30})


@pytest.mark.parametrize("entity_id,action,params", [
    ("light.salon", "explode", {}),
    ("light.salon", "turn_on", {"script": "x"}),
    ("shell_command.rm", "turn_on", {}),
])
def test_resolve_action_rejects_invalid(entity_id, action, params):
    with pytest.raises(HomeAssistantError):
        resolve_action(entity_id, action, params)


def test_cron_due_uses_home_timezone():
    # 07:30 à Paris (été) = 05:30 UTC.
    last = datetime(2026, 7, 1, 5, 0, tzinfo=timezone.utc)
    assert cron_is_due("30 7 * * *", last, datetime(2026, 7, 1, 5, 30, 10, tzinfo=timezone.utc), PARIS)
    assert not cron_is_due("30 7 * * *", datetime(2026, 7, 1, 5, 30, 10, tzinfo=timezone.utc),
                           datetime(2026, 7, 1, 5, 31, tzinfo=timezone.utc), PARIS)


def test_cron_first_run_does_not_catch_up_old_occurrences():
    assert not cron_is_due("0 3 * * *", None, datetime(2026, 7, 1, 12, 0, tzinfo=timezone.utc), PARIS)


def test_state_trigger_matching():
    trig = {"type": "state", "entity_id": "binary_sensor.porte", "to": "on"}
    ev = {"entity_id": "binary_sensor.porte", "old_state": {"state": "off"}, "new_state": {"state": "on"}}
    assert state_trigger_matches(trig, ev)
    assert not state_trigger_matches(trig, {**ev, "old_state": {"state": "on"}})
    assert not state_trigger_matches({**trig, "from": "unavailable"}, ev)


def test_password_hashing():
    h = hash_password("secret123")
    assert verify_password("secret123", h)
    assert not verify_password("secret124", h)
