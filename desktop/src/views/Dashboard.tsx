import { Activity, CalendarClock, Gauge, House, MessageSquarePlus, ShieldCheck, Volume2, VolumeX } from "lucide-react";
import { useMemo } from "react";

import { api } from "../api/client";
import { Chat } from "../components/Chat";
import { DeviceControl } from "../components/DeviceControl";
import { Orb } from "../components/Orb";
import { Card, deviceIcon, Toggle } from "../components/ui";
import type { Assistant } from "../hooks/useAssistant";
import { useAuth } from "../hooks/useAuth";
import { useHome } from "../hooks/useHome";
import { describeTrigger, formatState, greeting, isActive, relativeTime } from "../lib/format";
import { useDeviceAction } from "./useDeviceAction";

const STATUS = {
  idle: "Touchez l'orbe ou écrivez pour commencer",
  listening: "Je vous écoute…",
  thinking: "Je m'en occupe…",
  speaking: "Je vous réponds",
} as const;

export function Dashboard({ assistant }: { assistant: Assistant }) {
  const { user } = useAuth();
  const { devices, automations, activity, setAutomations } = useHome();
  const runAction = useDeviceAction();
  const readOnly = user?.role === "guest";

  const stats = useMemo(() => {
    const find = (cls: string) => devices.find((d) => d.domain === "sensor" && d.device_class === cls);
    const locks = devices.filter((d) => d.domain === "lock");
    return {
      temp: find("temperature"),
      humidity: find("humidity"),
      climate: devices.find((d) => d.domain === "climate"),
      lightsOn: devices.filter((d) => d.domain === "light" && d.state === "on").length,
      lights: devices.filter((d) => d.domain === "light").length,
      unlocked: locks.filter((d) => d.state !== "locked"),
      locks: locks.length,
      offline: devices.filter((d) => d.state === "unavailable").length,
    };
  }, [devices]);

  const quick = useMemo(
    () =>
      devices
        .filter((d) => d.is_exposed && !["sensor", "binary_sensor", "weather", "person"].includes(d.domain))
        .sort((a, b) => (a.room?.name ?? "~").localeCompare(b.room?.name ?? "~") || a.name.localeCompare(b.name)),
    [devices],
  );

  const temp = stats.temp?.state ?? (stats.climate?.attributes.current_temperature as string | undefined);

  return (
    <div className="dashboard">
      {/* Colonne gauche : environnement, sécurité, routines */}
      <div className="column">
        <Card title="Climat intérieur" icon={Gauge} sub={stats.temp?.room?.name ?? "Maison"}>
          <div className="big-number">
            {temp ?? "–"}
            <sup>°C</sup>
          </div>
          <div className="stat-row">
            <div className="stat">
              <span>Humidité</span>
              <strong>{stats.humidity ? `${stats.humidity.state} %` : "–"}</strong>
            </div>
            <div className="stat">
              <span>Consigne</span>
              <strong>{(stats.climate?.attributes.temperature as number | undefined) ?? "–"}°</strong>
            </div>
          </div>
        </Card>

        <Card
          title="Sécurité"
          icon={ShieldCheck}
          action={
            stats.unlocked.length ? (
              <span className="chip warn">
                <span className="dot" /> {stats.unlocked.length} accès ouvert
              </span>
            ) : (
              <span className="chip ok">
                <span className="dot" /> Protégée
              </span>
            )
          }
        >
          <div className="stat-row" style={{ marginTop: 0 }}>
            <div className="stat">
              <span>Lumières</span>
              <strong>
                {stats.lightsOn}/{stats.lights}
              </strong>
            </div>
            <div className="stat">
              <span>Hors ligne</span>
              <strong>{stats.offline}</strong>
            </div>
          </div>
        </Card>

        <Card title="Routines" icon={CalendarClock} className="grow">
          <div className="scroll">
            {automations.length === 0 && <div className="empty">Demandez à Aide de créer votre première routine.</div>}
            {automations.map((a) => (
              <div key={a.id} className="list-item">
                <div className="grow">
                  <strong>{a.name}</strong>
                  <small>{describeTrigger(a.trigger)}</small>
                </div>
                <Toggle
                  on={a.enabled}
                  label={a.name}
                  disabled={readOnly}
                  onChange={async (enabled) => {
                    setAutomations((prev) => prev.map((x) => (x.id === a.id ? { ...x, enabled } : x)));
                    await api.setAutomationEnabled(a.id, enabled).catch(() =>
                      setAutomations((prev) => prev.map((x) => (x.id === a.id ? { ...x, enabled: !enabled } : x))),
                    );
                  }}
                />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Centre : l'assistant */}
      <section className="card grow" style={{ padding: 0 }}>
        <div style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 8, zIndex: 2 }}>
          <button
            className="icon-btn"
            title={assistant.voiceReplies ? "Couper les réponses vocales" : "Activer les réponses vocales"}
            onClick={() => assistant.setVoiceReplies(!assistant.voiceReplies)}
          >
            {assistant.voiceReplies ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button className="icon-btn" title="Nouvelle conversation" onClick={() => void assistant.newConversation()}>
            <MessageSquarePlus size={16} />
          </button>
        </div>
        <div className="hero" style={assistant.messages.length ? { paddingBottom: 6 } : undefined}>
          <Orb
            state={assistant.orbState}
            level={assistant.level}
            size={assistant.messages.length ? 120 : 200}
            onClick={() => void assistant.toggleMic()}
          />
          {assistant.messages.length === 0 ? (
            <>
              <div className="hero-greeting">
                {greeting()}, <em>{user?.display_name}</em>
              </div>
              <div className="hero-status">{STATUS[assistant.orbState]}</div>
            </>
          ) : (
            <div className="hero-status">{STATUS[assistant.orbState]}</div>
          )}
        </div>
        <Chat
          messages={assistant.messages}
          thinking={assistant.thinking}
          recording={assistant.recording}
          draft={assistant.draft}
          onDraft={assistant.setDraft}
          onSend={(t) => void assistant.send(t)}
          onMic={() => void assistant.toggleMic()}
        />
      </section>

      {/* Colonne droite : commandes rapides et activité */}
      <div className="column">
        <Card title="Commandes rapides" icon={House} className="grow" sub={`${quick.length} appareils`}>
          <div className="scroll">
            {quick.length === 0 && <div className="empty">Aucun appareil synchronisé.</div>}
            {quick.map((d, i) => {
              const Icon = deviceIcon(d);
              const room = d.room?.name ?? "Autres";
              const showRoom = i === 0 || (quick[i - 1].room?.name ?? "Autres") !== room;
              return (
                <div key={d.id}>
                  {showRoom && <div className="room-label">{room}</div>}
                  <div className="device-row">
                    <div className={`device-icon ${isActive(d) ? "active" : ""} ${d.domain === "lock" ? "warm" : ""}`}>
                      <Icon size={18} />
                    </div>
                    <div className="device-meta">
                      <strong>{d.name}</strong>
                      <span>{formatState(d)}</span>
                    </div>
                    <DeviceControl device={d} readOnly={readOnly} onAction={runAction} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Activité" icon={Activity} sub="En direct" className="grow">
          <div className="scroll">
            {activity.length === 0 && <div className="empty">Les événements de la maison apparaîtront ici.</div>}
            {activity.map((a) => (
              <div key={a.id} className="list-item">
                <span className={`timeline-dot ${a.kind}`} />
                <div className="grow">
                  <strong>{a.title}</strong>
                  <small>
                    {a.detail} · {relativeTime(a.at)}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
