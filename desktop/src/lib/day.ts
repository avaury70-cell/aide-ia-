/**
 * Informations du jour calculées localement (sans Internet) :
 * soleil (algorithme NOAA simplifié), lune, jours fériés français, calendrier.
 */

const DAY_MS = 86_400_000;
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

// --- Calendrier -----------------------------------------------------------------------

export function dayOfYear(d: Date): number {
  const start = Date.UTC(d.getFullYear(), 0, 1);
  return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - start) / DAY_MS) + 1;
}

export function daysInYear(year: number): number {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;
}

/** Numéro de semaine ISO 8601 (la semaine 1 contient le premier jeudi de l'année). */
export function isoWeek(d: Date): number {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = Date.UTC(t.getUTCFullYear(), 0, 1);
  return Math.ceil(((t.getTime() - yearStart) / DAY_MS + 1) / 7);
}

export function season(d: Date): { name: string; emoji: string } {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const md = m * 100 + day;
  if (md >= 320 && md < 621) return { name: "Printemps", emoji: "🌱" };
  if (md >= 621 && md < 922) return { name: "Été", emoji: "☀️" };
  if (md >= 922 && md < 1221) return { name: "Automne", emoji: "🍂" };
  return { name: "Hiver", emoji: "❄️" };
}

/** Jours avant le prochain samedi (0 si on est le week-end). */
export function daysUntilWeekend(d: Date): number {
  const day = d.getDay();
  return day === 0 || day === 6 ? 0 : 6 - day;
}

// --- Jours fériés (France métropolitaine) ------------------------------------------------

/** Dimanche de Pâques (algorithme de Meeus/Jones/Butcher). */
export function easter(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

export interface Holiday {
  date: Date;
  name: string;
}

export function frenchHolidays(year: number): Holiday[] {
  const e = easter(year);
  const plus = (n: number) => new Date(e.getFullYear(), e.getMonth(), e.getDate() + n);
  return [
    { date: new Date(year, 0, 1), name: "Jour de l'An" },
    { date: plus(1), name: "Lundi de Pâques" },
    { date: new Date(year, 4, 1), name: "Fête du Travail" },
    { date: new Date(year, 4, 8), name: "Victoire 1945" },
    { date: plus(39), name: "Ascension" },
    { date: plus(50), name: "Lundi de Pentecôte" },
    { date: new Date(year, 6, 14), name: "Fête nationale" },
    { date: new Date(year, 7, 15), name: "Assomption" },
    { date: new Date(year, 10, 1), name: "Toussaint" },
    { date: new Date(year, 10, 11), name: "Armistice 1918" },
    { date: new Date(year, 11, 25), name: "Noël" },
  ].sort((a, b) => a.date.getTime() - b.date.getTime());
}

/** Prochains jours fériés à partir d'aujourd'hui (inclus). */
export function upcomingHolidays(from: Date, count = 3): (Holiday & { inDays: number })[] {
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return [...frenchHolidays(from.getFullYear()), ...frenchHolidays(from.getFullYear() + 1)]
    .filter((h) => h.date >= today)
    .slice(0, count)
    .map((h) => ({ ...h, inDays: Math.round((h.date.getTime() - today.getTime()) / DAY_MS) }));
}

// --- Soleil -------------------------------------------------------------------------------

export interface SunTimes {
  sunrise: Date | null;
  sunset: Date | null;
  noon: Date;
  dayLengthMin: number;
}

/** Lever/coucher du soleil (précision ~1 min) pour une latitude/longitude donnée. */
export function sunTimes(date: Date, lat: number, lon: number): SunTimes {
  // Jour julien à midi UTC du jour civil local.
  const jd = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12) / DAY_MS + 2440587.5;
  const n = jd - 2451545.0 + 0.0008;
  const jStar = n - lon / 360;
  const M = (357.5291 + 0.98560028 * jStar) % 360;
  const C = 1.9148 * Math.sin(rad(M)) + 0.02 * Math.sin(rad(2 * M)) + 0.0003 * Math.sin(rad(3 * M));
  const lambda = (M + C + 180 + 102.9372) % 360;
  const jTransit = 2451545.0 + jStar + 0.0053 * Math.sin(rad(M)) - 0.0069 * Math.sin(rad(2 * lambda));
  const decl = Math.asin(Math.sin(rad(lambda)) * Math.sin(rad(23.4397)));
  const cosH =
    (Math.sin(rad(-0.833)) - Math.sin(rad(lat)) * Math.sin(decl)) / (Math.cos(rad(lat)) * Math.cos(decl));
  const toDate = (j: number) => new Date((j - 2440587.5) * DAY_MS);
  const noon = toDate(jTransit);
  if (cosH > 1) return { sunrise: null, sunset: null, noon, dayLengthMin: 0 }; // nuit polaire
  if (cosH < -1) return { sunrise: null, sunset: null, noon, dayLengthMin: 1440 }; // jour polaire
  const H = deg(Math.acos(cosH)) / 360;
  const sunrise = toDate(jTransit - H);
  const sunset = toDate(jTransit + H);
  return { sunrise, sunset, noon, dayLengthMin: Math.round((sunset.getTime() - sunrise.getTime()) / 60000) };
}

// --- Lune -------------------------------------------------------------------------------------

const SYNODIC = 29.530588853;
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14); // nouvelle lune de référence

export interface MoonInfo {
  age: number; // jours depuis la nouvelle lune
  illumination: number; // 0–1
  name: string;
  emoji: string;
  nextFull: Date;
}

export function moon(d: Date): MoonInfo {
  const days = (d.getTime() - KNOWN_NEW_MOON) / DAY_MS;
  const age = ((days % SYNODIC) + SYNODIC) % SYNODIC;
  const illumination = (1 - Math.cos((2 * Math.PI * age) / SYNODIC)) / 2;
  const phases: [number, string, string][] = [
    [1.84, "Nouvelle lune", "🌑"],
    [5.53, "Premier croissant", "🌒"],
    [9.22, "Premier quartier", "🌓"],
    [12.91, "Gibbeuse croissante", "🌔"],
    [16.61, "Pleine lune", "🌕"],
    [20.3, "Gibbeuse décroissante", "🌖"],
    [23.99, "Dernier quartier", "🌗"],
    [27.68, "Dernier croissant", "🌘"],
    [SYNODIC + 1, "Nouvelle lune", "🌑"],
  ];
  const [, name, emoji] = phases.find(([limit]) => age < limit)!;
  const toFull = (SYNODIC / 2 - age + SYNODIC) % SYNODIC;
  return { age, illumination, name, emoji, nextFull: new Date(d.getTime() + toFull * DAY_MS) };
}

// --- Mise en forme -------------------------------------------------------------------------------

export const hhmm = (d: Date | null) =>
  d ? d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "—";

export const duration = (min: number) => `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, "0")}`;
