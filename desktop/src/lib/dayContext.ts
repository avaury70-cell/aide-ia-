import type { City, Weather } from "../../shared/ipc";
import type { Task } from "../hooks/useDayData";
import { duration, hhmm, moon, sunTimes, upcomingHolidays } from "./day";
import { describeWeather } from "./weatherCodes";

/** Résumé texte des informations affichées, transmis à l'assistant avec chaque message. */
export function buildDayContext({ city, weather, tasks }: { city: City | null; weather: Weather | null; tasks: Task[] }): string {
  const now = new Date();
  const lines: string[] = [];
  const place = city ? `${city.name}${city.region ? ` (${city.region})` : ""}` : "ville non choisie (soleil calculé pour Paris)";
  lines.push(`Lieu : ${place}.`);
  const sun = sunTimes(now, city?.lat ?? 48.8566, city?.lon ?? 2.3522);
  lines.push(`Soleil : lever ${hhmm(sun.sunrise)}, coucher ${hhmm(sun.sunset)}, durée du jour ${duration(sun.dayLengthMin)}.`);
  const m = moon(now);
  lines.push(`Lune : ${m.name} (${Math.round(m.illumination * 100)} %).`);
  const h = upcomingHolidays(now, 2).map((x) => `${x.name} dans ${x.inDays} jour(s)`).join(", ");
  if (h) lines.push(`Prochains jours fériés : ${h}.`);
  if (weather) {
    const c = weather.current;
    lines.push(
      `Météo actuelle : ${describeWeather(c.code, c.isDay).label}, ${Math.round(c.temp)} °C (ressenti ${Math.round(c.feelsLike)} °C), humidité ${c.humidity} %, vent ${Math.round(c.wind)} km/h.`,
    );
    const d0 = weather.days[0];
    if (d0) lines.push(`Aujourd'hui : max ${Math.round(d0.max)} °C, min ${Math.round(d0.min)} °C, pluie ${d0.rain} %, UV ${Math.round(d0.uv)}.`);
    const hours = weather.hours
      .filter((_, i) => i % 3 === 0)
      .map((x) => `${x.time.slice(11, 16)} ${Math.round(x.temp)}° pluie ${x.rain} %`)
      .join(" ; ");
    if (hours) lines.push(`Prochaines heures : ${hours}.`);
    const next = weather.days
      .slice(1, 4)
      .map((x) => `${x.date} ${describeWeather(x.code).label} ${Math.round(x.min)}–${Math.round(x.max)} °C`)
      .join(" ; ");
    if (next) lines.push(`Jours suivants : ${next}.`);
  } else {
    lines.push("Météo : non disponible.");
  }
  const todo = tasks.filter((t) => !t.done).map((t) => `« ${t.text} »`);
  const done = tasks.filter((t) => t.done).length;
  lines.push(todo.length ? `Tâches à faire : ${todo.join(", ")}.` : "Aucune tâche en attente.");
  if (done) lines.push(`${done} tâche(s) déjà terminée(s).`);
  return lines.join("\n");
}
