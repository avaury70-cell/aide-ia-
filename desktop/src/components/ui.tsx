import {
  AirVent,
  Blinds,
  Clapperboard,
  Fan,
  Lightbulb,
  Lock,
  LockOpen,
  type LucideIcon,
  Plug,
  ScrollText,
  ShieldCheck,
  Speaker,
  Sparkles,
  Thermometer,
  ToggleLeft,
  User,
  Waves,
  CloudSun,
  Activity,
} from "lucide-react";
import type { ReactNode } from "react";

import type { Device } from "../api/types";

export function Card({ title, icon: Icon, sub, action, className = "", children }: {
  title?: string;
  icon?: LucideIcon;
  sub?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`card ${className}`}>
      {title && (
        <header className="card-head">
          <div className="card-title">
            {Icon && (
              <span className="icon-bubble">
                <Icon size={17} />
              </span>
            )}
            <div>
              {title}
              {sub && <div className="card-sub">{sub}</div>}
            </div>
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function Toggle({ on, onChange, disabled, label }: {
  on: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`toggle ${on ? "on" : ""}`}
      disabled={disabled}
      onClick={() => onChange(!on)}
    />
  );
}

const DOMAIN_ICONS: Record<string, LucideIcon> = {
  light: Lightbulb,
  switch: Plug,
  fan: Fan,
  cover: Blinds,
  climate: Thermometer,
  media_player: Speaker,
  scene: Clapperboard,
  script: ScrollText,
  alarm_control_panel: ShieldCheck,
  vacuum: Sparkles,
  valve: Waves,
  weather: CloudSun,
  person: User,
  input_boolean: ToggleLeft,
  binary_sensor: Activity,
  sensor: AirVent,
};

export function deviceIcon(d: Device): LucideIcon {
  if (d.domain === "lock") return d.state === "locked" ? Lock : LockOpen;
  if (d.domain === "sensor" && d.device_class === "temperature") return Thermometer;
  if (d.domain === "sensor" && d.device_class === "humidity") return Waves;
  return DOMAIN_ICONS[d.domain] ?? Activity;
}
