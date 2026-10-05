import { PartyPopper } from "lucide-react";
import { useMemo } from "react";

import { useClock } from "../../hooks/useClock";
import { upcomingHolidays } from "../../lib/day";
import { Card } from "../ui";

export function HolidaysCard() {
  const now = useClock(3_600_000);
  const list = useMemo(() => upcomingHolidays(now, 3), [now]);
  return (
    <Card title="Jours fériés" icon={PartyPopper} sub="France" className="grow">
      <div className="scroll">
        {list.map((h) => (
          <div key={h.name + h.date.toISOString()} className="list-item">
            <div className="date-badge">
              <strong>{h.date.getDate()}</strong>
              <span>{h.date.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "")}</span>
            </div>
            <div className="grow">
              <strong>{h.name}</strong>
              <small>{h.date.toLocaleDateString("fr-FR", { weekday: "long" })}</small>
            </div>
            <span className={`chip ${h.inDays <= 7 ? "warn" : ""}`}>
              {h.inDays === 0 ? "Aujourd'hui" : h.inDays === 1 ? "Demain" : `J-${h.inDays}`}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
