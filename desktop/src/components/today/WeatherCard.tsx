import { Droplets, MapPin, Search, Thermometer, Wind } from "lucide-react";
import { useState, type FormEvent } from "react";

import type { City, Weather } from "../../../shared/ipc";
import { bridge } from "../../lib/bridge";
import { describeWeather, outfitTip } from "../../lib/weatherCodes";
import { Card } from "../ui";

function CityPicker({ onPick, onCancel }: { onPick: (c: City) => void; onCancel?: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<City[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const search = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = await bridge.searchCity(query);
    setBusy(false);
    if (res.ok) {
      setResults(res.data ?? []);
      setError(res.data?.length ? null : "Aucune ville trouvée.");
    } else setError(res.error ?? "Recherche impossible");
  };

  return (
    <div>
      <form className="search-row" onSubmit={search}>
        <input
          className="input"
          placeholder="Votre ville (ex. Lyon)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <button className="icon-btn" disabled={busy || query.trim().length < 2} title="Rechercher">
          <Search size={16} />
        </button>
      </form>
      {error && <div className="card-note">{error}</div>}
      <div className="city-results">
        {results.map((c) => (
          <button key={`${c.lat},${c.lon}`} className="settings-row" onClick={() => onPick(c)}>
            <span>
              <b>{c.name}</b>
              <small>{c.region}</small>
            </span>
          </button>
        ))}
      </div>
      {onCancel && (
        <button className="link-btn" style={{ marginTop: 10, fontSize: 13 }} onClick={onCancel}>
          Annuler
        </button>
      )}
    </div>
  );
}

export function WeatherCard({ city, weather, error, onCity }: {
  city: City | null;
  weather: Weather | null;
  error: string | null;
  onCity: (c: City) => void;
}) {
  const [picking, setPicking] = useState(false);

  const action = city && !picking && (
    <button className="mini-btn" onClick={() => setPicking(true)}>
      <MapPin size={12} style={{ verticalAlign: -1 }} /> Changer
    </button>
  );

  if (!city || picking) {
    return (
      <Card title="Météo" icon={Thermometer} sub="Choisissez votre ville">
        <CityPicker
          onPick={(c) => {
            onCity(c);
            setPicking(false);
          }}
          onCancel={city ? () => setPicking(false) : undefined}
        />
      </Card>
    );
  }

  if (!weather) {
    return (
      <Card title="Météo" icon={Thermometer} sub={city.name} action={action}>
        <div className="empty">{error ?? "Chargement de la météo…"}</div>
      </Card>
    );
  }

  const now = describeWeather(weather.current.code, weather.current.isDay);
  const NowIcon = now.icon;
  const today = weather.days[0];
  const maxRain = Math.max(...weather.hours.map((h) => h.rain), 0);
  const temps = weather.hours.map((h) => h.temp);
  const tMin = Math.min(...temps);
  const tMax = Math.max(...temps);

  return (
    <Card title="Météo" icon={Thermometer} sub={city.name} action={action}>
      <div className="weather-now">
        <NowIcon size={54} strokeWidth={1.4} className="weather-icon" />
        <div>
          <div className="big-number">
            {Math.round(weather.current.temp)}
            <sup>°C</sup>
          </div>
          <div className="weather-label">
            {now.label} · ressenti {Math.round(weather.current.feelsLike)}°
          </div>
        </div>
      </div>
      <div className="weather-meta">
        <span>
          <Droplets size={13} /> {weather.current.humidity} %
        </span>
        <span>
          <Wind size={13} /> {Math.round(weather.current.wind)} km/h
        </span>
        {today && (
          <span>
            ↑ {Math.round(today.max)}° ↓ {Math.round(today.min)}°
          </span>
        )}
      </div>

      <div className="hours" aria-label="Prochaines heures">
        {weather.hours.map((h) => {
          const H = describeWeather(h.code).icon;
          const height = tMax === tMin ? 50 : 25 + ((h.temp - tMin) / (tMax - tMin)) * 60;
          return (
            <div key={h.time} className="hour">
              <span className="hour-temp">{Math.round(h.temp)}°</span>
              <div className="hour-bar">
                <div style={{ height: `${height}%` }} />
              </div>
              <H size={14} />
              <span className="hour-time">{h.time.slice(11, 13)} h</span>
              {maxRain > 0 && <span className="hour-rain">{h.rain} %</span>}
            </div>
          );
        })}
      </div>

      <div className="days">
        {weather.days.slice(1, 4).map((d) => {
          const D = describeWeather(d.code).icon;
          return (
            <div key={d.date} className="day">
              <span>{new Date(d.date + "T12:00").toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "")}</span>
              <D size={18} />
              <strong>
                {Math.round(d.max)}° <small>{Math.round(d.min)}°</small>
              </strong>
            </div>
          );
        })}
      </div>
      {today && <p className="card-note">Tenue conseillée : {outfitTip(weather.current.feelsLike, today.rain)}.</p>}
    </Card>
  );
}
