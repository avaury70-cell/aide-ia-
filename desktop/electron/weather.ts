/**
 * Météo via Open-Meteo (gratuit, sans clé). Appelé depuis le processus principal :
 * l'interface n'a pas d'accès réseau direct.
 */
import type { ApiResult, City, Weather } from "../shared/ipc";

// Adresses surchargeables pour les tests (serveur local de démonstration).
const FORECAST = process.env.AIDE_WEATHER_URL ?? "https://api.open-meteo.com/v1/forecast";
const GEOCODING = process.env.AIDE_GEOCODING_URL ?? "https://geocoding-api.open-meteo.com/v1/search";

async function getJson(url: string): Promise<unknown> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 10_000);
  try {
    const res = await fetch(url, { signal: ctl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function searchCity(name: string): Promise<ApiResult<City[]>> {
  const q = name.trim();
  if (q.length < 2) return { ok: true, status: 200, data: [] };
  try {
    const data = (await getJson(`${GEOCODING}?name=${encodeURIComponent(q)}&count=6&language=fr&format=json`)) as {
      results?: { name: string; admin1?: string; country?: string; latitude: number; longitude: number; timezone?: string }[];
    };
    const cities = (data.results ?? []).map((r) => ({
      name: r.name,
      region: [r.admin1, r.country].filter(Boolean).join(", "),
      lat: r.latitude,
      lon: r.longitude,
    }));
    return { ok: true, status: 200, data: cities };
  } catch {
    return { ok: false, status: 0, error: "Recherche impossible : vérifiez votre connexion Internet." };
  }
}

export async function getWeather(lat: number, lon: number): Promise<ApiResult<Weather>> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return { ok: false, status: 400, error: "Position invalide" };
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day",
    hourly: "temperature_2m,precipitation_probability,weather_code",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max",
    timezone: "auto",
    forecast_days: "4",
  });
  try {
    const d = (await getJson(`${FORECAST}?${params}`)) as {
      current: { time: string; temperature_2m: number; apparent_temperature: number; relative_humidity_2m: number; wind_speed_10m: number; weather_code: number; is_day: number };
      hourly: { time: string[]; temperature_2m: number[]; precipitation_probability: number[]; weather_code: number[] };
      daily: { time: string[]; weather_code: number[]; temperature_2m_max: number[]; temperature_2m_min: number[]; precipitation_probability_max: number[]; uv_index_max: number[] };
    };
    // Les 12 prochaines heures à partir de l'heure courante (heure locale du lieu).
    const start = Math.max(0, d.hourly.time.findIndex((t) => t >= d.current.time.slice(0, 13)));
    const hours = d.hourly.time.slice(start, start + 12).map((time, i) => ({
      time,
      temp: d.hourly.temperature_2m[start + i],
      rain: d.hourly.precipitation_probability[start + i] ?? 0,
      code: d.hourly.weather_code[start + i],
    }));
    const days = d.daily.time.map((date, i) => ({
      date,
      code: d.daily.weather_code[i],
      max: d.daily.temperature_2m_max[i],
      min: d.daily.temperature_2m_min[i],
      rain: d.daily.precipitation_probability_max[i] ?? 0,
      uv: d.daily.uv_index_max[i] ?? 0,
    }));
    return {
      ok: true,
      status: 200,
      data: {
        updatedAt: new Date().toISOString(),
        current: {
          temp: d.current.temperature_2m,
          feelsLike: d.current.apparent_temperature,
          humidity: d.current.relative_humidity_2m,
          wind: d.current.wind_speed_10m,
          code: d.current.weather_code,
          isDay: d.current.is_day === 1,
        },
        hours,
        days,
      },
    };
  } catch {
    return { ok: false, status: 0, error: "Météo indisponible : vérifiez votre connexion Internet." };
  }
}
