import { CalendarDays } from "lucide-react";

import { useClock } from "../../hooks/useClock";
import { dayOfYear, daysInYear, daysUntilWeekend, isoWeek, season } from "../../lib/day";
import { Card } from "../ui";

export function TodayCard() {
  const now = useClock(1000);
  const doy = dayOfYear(now);
  const total = daysInYear(now.getFullYear());
  const progress = doy / total;
  const weekend = daysUntilWeekend(now);
  const s = season(now);
  const date = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <Card title="Aujourd'hui" icon={CalendarDays}>
      <div className="big-clock">
        {now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
        <span>{String(now.getSeconds()).padStart(2, "0")}</span>
      </div>
      <div className="today-date">{date}</div>
      <div className="stat-row three">
        <div className="stat">
          <span>Semaine</span>
          <strong>{isoWeek(now)}</strong>
        </div>
        <div className="stat">
          <span>Saison</span>
          <strong>{s.name}</strong>
        </div>
        <div className="stat">
          <span>Week-end</span>
          <strong>{weekend === 0 ? "C'est le week-end" : `J-${weekend}`}</strong>
        </div>
      </div>
      <div className="year-progress" title={`${doy}e jour sur ${total}`}>
        <div className="year-progress-label">
          <span>Année {now.getFullYear()}</span>
          <span>
            Jour {doy} / {total} · {Math.round(progress * 100)} %
          </span>
        </div>
        <div className="meter">
          <div style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
    </Card>
  );
}
