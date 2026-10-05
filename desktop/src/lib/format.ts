import type { Device, Trigger } from "../api/types";

const STATE_LABELS: Record<string, string> = {
  on: "Allumé",
  off: "Éteint",
  locked: "Verrouillé",
  unlocked: "Déverrouillé",
  open: "Ouvert",
  closed: "Fermé",
  opening: "Ouverture…",
  closing: "Fermeture…",
  playing: "Lecture",
  paused: "En pause",
  idle: "Inactif",
  heat: "Chauffage",
  cool: "Climatisation",
  auto: "Auto",
  home: "Présent",
  not_home: "Absent",
  armed_away: "Armée (absent)",
  armed_home: "Armée (présent)",
  disarmed: "Désarmée",
  unavailable: "Indisponible",
};

export function formatState(d: Device): string {
  const a = d.attributes;
  if (d.domain === "climate") {
    return `${a.current_temperature ?? "–"}° · consigne ${a.temperature ?? "–"}°`;
  }
  if (d.domain === "light" && d.state === "on" && typeof a.brightness === "number") {
    return `${Math.round((a.brightness / 255) * 100)} %`;
  }
  if (d.domain === "cover" && typeof a.current_position === "number") {
    return `${STATE_LABELS[d.state ?? ""] ?? d.state} · ${a.current_position} %`;
  }
  const state = d.state ?? "–";
  if (STATE_LABELS[state]) return STATE_LABELS[state];
  return a.unit_of_measurement ? `${state} ${String(a.unit_of_measurement)}` : state;
}

export const isActive = (d: Device) =>
  ["on", "playing", "open", "unlocked", "heat", "cool", "auto"].includes(d.state ?? "");

export const TOGGLE_DOMAINS = new Set(["light", "switch", "fan", "input_boolean", "media_player"]);

export const TOOL_LABELS: Record<string, string> = {
  list_devices: "Inventaire",
  get_device_state: "Lecture d'état",
  control_device: "Commande",
  get_history: "Historique",
  create_automation: "Nouvelle routine",
  list_automations: "Routines",
  set_automation_enabled: "Routine modifiée",
  remember: "Mémorisé",
  recall: "Souvenirs",
  forget: "Oublié",
  notify_household: "Notification",
};

const DAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

/** Description lisible des expressions cron courantes ; sinon l'expression brute. */
export function describeTrigger(t: Trigger): string {
  if (t.type === "state") return `Quand ${t.entity_id}${t.to ? ` passe à « ${t.to} »` : " change"}`;
  const [min, hour, dom, mon, dow] = t.cron.split(/\s+/);
  if (/^\d+$/.test(min) && /^\d+$/.test(hour) && dom === "*" && mon === "*") {
    const time = `${hour.padStart(2, "0")}:${min.padStart(2, "0")}`;
    if (dow === "*") return `Tous les jours à ${time}`;
    if (dow === "1-5") return `En semaine à ${time}`;
    if (dow === "0,6" || dow === "6,0") return `Le week-end à ${time}`;
    if (/^\d$/.test(dow)) return `Chaque ${DAYS[Number(dow) % 7]} à ${time}`;
  }
  return `Planifié · ${t.cron}`;
}

export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return "Bonne nuit";
  if (h < 18) return "Bonjour";
  return "Bonsoir";
}

export function relativeTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
