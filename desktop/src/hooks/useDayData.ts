import { useCallback, useEffect, useState } from "react";

import type { City, Weather } from "../../shared/ipc";
import { bridge } from "../lib/bridge";

export interface Task {
  id: string;
  text: string;
  done: boolean;
}

const TASKS_KEY = "aide.tasks";
const TASKS_DAY_KEY = "aide.tasks.day";

function readTasks(): Task[] {
  try {
    // Les tâches cochées la veille sont retirées au changement de jour.
    const today = new Date().toDateString();
    const tasks = JSON.parse(localStorage.getItem(TASKS_KEY) ?? "[]") as Task[];
    if (localStorage.getItem(TASKS_DAY_KEY) !== today) {
      localStorage.setItem(TASKS_DAY_KEY, today);
      return tasks.filter((t) => !t.done);
    }
    return tasks;
  } catch {
    return [];
  }
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(readTasks);
  useEffect(() => {
    try {
      localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    } catch {
      // stockage indisponible
    }
  }, [tasks]);
  return {
    tasks,
    add: (text: string) =>
      setTasks((prev) => [...prev, { id: `${Date.now()}-${prev.length}`, text: text.trim(), done: false }]),
    toggle: (id: string) => setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))),
    remove: (id: string) => setTasks((prev) => prev.filter((t) => t.id !== id)),
  };
}

/** Ville choisie + météo, actualisée toutes les 20 minutes. */
export function useWeather() {
  const [city, setCityState] = useState<City | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void bridge.getCity().then((c) => {
      setCityState(c);
      setLoaded(true);
    });
  }, []);

  const refresh = useCallback(async () => {
    if (!city) return;
    const res = await bridge.getWeather(city.lat, city.lon);
    if (res.ok && res.data) {
      setWeather(res.data);
      setError(null);
    } else setError(res.error ?? "Météo indisponible");
  }, [city]);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), 20 * 60_000);
    return () => clearInterval(id);
  }, [refresh]);

  const setCity = async (c: City) => {
    await bridge.setCity(c);
    setWeather(null);
    setCityState(c);
  };

  return { city, loaded, weather, error, setCity, refresh };
}
