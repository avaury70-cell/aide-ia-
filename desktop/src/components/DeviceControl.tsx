import { ChevronDown, ChevronUp, Play } from "lucide-react";

import type { Device } from "../api/types";
import { TOGGLE_DOMAINS } from "../lib/format";
import { Toggle } from "./ui";

interface Props {
  device: Device;
  readOnly: boolean;
  onAction: (device: Device, action: string) => void;
}

/** Commande adaptée au type d'appareil (interrupteur, volet, serrure, scène…). */
export function DeviceControl({ device, readOnly, onAction }: Props) {
  const unavailable = device.state === "unavailable";
  if (TOGGLE_DOMAINS.has(device.domain)) {
    const on = device.state === "on" || device.state === "playing";
    return (
      <Toggle
        on={on}
        label={device.name}
        disabled={readOnly || unavailable}
        onChange={(v) => onAction(device, v ? "turn_on" : "turn_off")}
      />
    );
  }
  if (device.domain === "cover") {
    return (
      <div style={{ display: "flex", gap: 6 }}>
        <button className="icon-btn" title="Ouvrir" disabled={readOnly} onClick={() => onAction(device, "open")}>
          <ChevronUp size={16} />
        </button>
        <button className="icon-btn" title="Fermer" disabled={readOnly} onClick={() => onAction(device, "close")}>
          <ChevronDown size={16} />
        </button>
      </div>
    );
  }
  if (device.domain === "lock") {
    const locked = device.state === "locked";
    return (
      <button className="mini-btn" disabled={readOnly} onClick={() => onAction(device, locked ? "unlock" : "lock")}>
        {locked ? "Ouvrir" : "Verrouiller"}
      </button>
    );
  }
  if (device.domain === "scene" || device.domain === "script") {
    return (
      <button className="icon-btn" title="Lancer" disabled={readOnly} onClick={() => onAction(device, "activate")}>
        <Play size={15} />
      </button>
    );
  }
  return null;
}
