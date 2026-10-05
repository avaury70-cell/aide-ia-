from sqlalchemy import select

from app.models import AuditLog, Device, PendingAction
from app.services.automations import AutomationEngine
from app.services.home import record_state_change

from .conftest import response, text_block, tool_block


async def test_first_user_is_admin_and_registration_is_closed(client):
    r = await client.post("/auth/register", json={"email": "a@x.fr", "password": "12345678", "display_name": "A"})
    assert r.json()["user"]["role"] == "admin"
    r = await client.post("/auth/register", json={"email": "b@x.fr", "password": "12345678", "display_name": "B"})
    assert r.status_code == 401
    r = await client.post("/auth/login", json={"email": "a@x.fr", "password": "mauvais!!"})
    assert r.status_code == 401


async def test_sync_imports_only_relevant_domains(client, admin):
    r = await client.get("/devices", headers=admin)
    ids = {d["entity_id"] for d in r.json()}
    assert "light.salon" in ids and "sensor.temperature_salon" in ids
    assert "sun.sun" not in ids
    lock = next(d for d in r.json() if d["entity_id"] == "lock.porte_entree")
    assert lock["is_sensitive"] is True


async def test_chat_runs_tool_loop_and_controls_light(client, admin, home, llm, session):
    llm.script = [
        response("tool_use", text_block("J'allume."),
                 tool_block("control_device", {"entity_id": "light.salon", "action": "turn_on",
                                               "parameters": {"brightness_pct": 40}})),
        response("end_turn", text_block("C'est fait, le salon est à 40 %.")),
    ]
    conv = (await client.post("/conversations", headers=admin)).json()
    r = await client.post(f"/conversations/{conv['id']}/messages", headers=admin,
                          json={"content": "Allume le salon à 40%"})
    assert r.status_code == 200, r.text
    assert r.json()["assistant_message"]["content"] == "C'est fait, le salon est à 40 %."
    assert [(c.domain, c.service, c.data) for c in home.calls] == [
        ("light", "turn_on", {"entity_id": "light.salon", "brightness_pct": 40})
    ]
    # Le résultat d'outil est renvoyé au modèle dans un message utilisateur.
    second = llm.requests[1]["messages"]
    assert second[-1]["content"][0]["type"] == "tool_result"
    assert llm.requests[0]["fallbacks"] == "default"
    async with session() as db:
        audit = (await db.scalars(select(AuditLog))).all()
        assert audit[0].action == "light.turn_on" and audit[0].actor.value == "assistant"

    # Le tour suivant rejoue l'historique texte.
    llm.script = [response("end_turn", text_block("Avec plaisir."))]
    await client.post(f"/conversations/{conv['id']}/messages", headers=admin, json={"content": "Merci"})
    hist = llm.requests[-1]["messages"]
    assert [m["role"] for m in hist] == ["user", "assistant", "user"]


async def test_invalid_parameters_are_reported_to_model(client, admin, home, llm):
    llm.script = [
        response("tool_use", tool_block("control_device", {"entity_id": "light.salon", "action": "turn_on",
                                                           "parameters": {"rm -rf": 1}})),
        response("end_turn", text_block("Je n'ai pas pu.")),
    ]
    conv = (await client.post("/conversations", headers=admin)).json()
    await client.post(f"/conversations/{conv['id']}/messages", headers=admin, json={"content": "?"})
    tool_result = llm.requests[1]["messages"][-1]["content"][0]
    assert tool_result["is_error"] is True
    assert home.calls == []


async def test_sensitive_action_requires_confirmation(client, admin, home, llm, session):
    llm.script = [
        response("tool_use", tool_block("control_device", {"entity_id": "lock.porte_entree", "action": "unlock"})),
        response("end_turn", text_block("Validez le déverrouillage dans l'application.")),
    ]
    conv = (await client.post("/conversations", headers=admin)).json()
    r = await client.post(f"/conversations/{conv['id']}/messages", headers=admin,
                          json={"content": "Ouvre la porte"})
    pending = r.json()["pending_actions"]
    assert len(pending) == 1 and home.calls == []

    r = await client.post(f"/pending-actions/{pending[0]['id']}/confirm", headers=admin)
    assert r.status_code == 200, r.text
    assert home.calls[0].service == "unlock"
    # Une seconde confirmation est refusée.
    r = await client.post(f"/pending-actions/{pending[0]['id']}/confirm", headers=admin)
    assert r.status_code == 409
    async with session() as db:
        assert (await db.scalars(select(PendingAction))).one().status.value == "confirmed"


async def test_assistant_cannot_automate_sensitive_device(client, admin, home, llm):
    llm.script = [
        response("tool_use", tool_block("create_automation", {
            "name": "Ouvrir le matin", "trigger": {"type": "time", "cron": "0 7 * * *"},
            "actions": [{"type": "device", "entity_id": "lock.porte_entree", "action": "unlock"}]})),
        response("end_turn", text_block("Impossible.")),
    ]
    conv = (await client.post("/conversations", headers=admin)).json()
    await client.post(f"/conversations/{conv['id']}/messages", headers=admin, json={"content": "x"})
    assert llm.requests[1]["messages"][-1]["content"][0]["is_error"] is True
    assert (await client.get("/automations", headers=admin)).json() == []


async def test_guest_cannot_control(client, admin, home):
    r = await client.post("/auth/register", headers=admin, json={
        "email": "invite@x.fr", "password": "12345678", "display_name": "Invité", "role": "guest"})
    guest = {"Authorization": f"Bearer {r.json()['access_token']}"}
    r = await client.post("/devices/light.salon/action", headers=guest, json={"action": "turn_on"})
    assert r.status_code == 403
    assert home.calls == []


async def test_state_trigger_runs_automation(client, admin, home, session):
    r = await client.post("/automations", headers=admin, json={
        "name": "Garage ouvert la nuit",
        "trigger": {"type": "state", "entity_id": "binary_sensor.porte_garage", "to": "on"},
        "conditions": [{"entity_id": "light.cuisine", "state": "on"}],
        "actions": [{"type": "device", "entity_id": "light.salon", "action": "turn_on"},
                    {"type": "notify", "message": "La porte du garage est ouverte"}],
    })
    assert r.status_code == 201, r.text
    event = {"entity_id": "binary_sensor.porte_garage",
             "old_state": {"state": "off"}, "new_state": {"state": "on", "attributes": {}}}
    engine = AutomationEngine(session)
    async with session() as db:
        assert await record_state_change(db, event) is not None
        await engine.on_state_change(db, event)
        device = await db.scalar(select(Device).where(Device.entity_id == "binary_sensor.porte_garage"))
        assert device.state == "on"
    assert [c.data["entity_id"] for c in home.calls] == ["light.salon"]
    runs = (await client.get(f"/automations/{r.json()['id']}/runs", headers=admin)).json()
    assert runs[0]["status"] == "success"


async def test_invalid_cron_rejected(client, admin):
    r = await client.post("/automations", headers=admin, json={
        "name": "x", "trigger": {"type": "time", "cron": "tous les jours"},
        "actions": [{"type": "notify", "message": "m"}]})
    assert r.status_code == 422
