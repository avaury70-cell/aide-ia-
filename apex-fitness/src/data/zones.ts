/** Zones d'implantation — statuts FICTIFS, à titre d'illustration. */
export type ZoneStatus = 'dispo' | 'discussion' | 'attribuee';
export type City = { name: string; lon: number; lat: number; status: ZoneStatus };

export const STATUS_LABEL: Record<ZoneStatus, string> = {
  dispo: 'Disponible',
  discussion: 'En discussion',
  attribuee: 'Attribuée',
};

export const CITIES: City[] = [
  { name: 'Lille', lon: 3.06, lat: 50.63, status: 'attribuee' },
  { name: 'Paris', lon: 2.35, lat: 48.86, status: 'attribuee' },
  { name: 'Lyon', lon: 4.83, lat: 45.76, status: 'attribuee' },
  { name: 'Rennes', lon: -1.68, lat: 48.11, status: 'discussion' },
  { name: 'Bordeaux', lon: -0.58, lat: 44.84, status: 'discussion' },
  { name: 'Marseille', lon: 5.37, lat: 43.3, status: 'discussion' },
  { name: 'Strasbourg', lon: 7.75, lat: 48.58, status: 'discussion' },
  { name: 'Rouen', lon: 1.1, lat: 49.44, status: 'dispo' },
  { name: 'Caen', lon: -0.36, lat: 49.18, status: 'dispo' },
  { name: 'Brest', lon: -4.49, lat: 48.39, status: 'dispo' },
  { name: 'Nantes', lon: -1.55, lat: 47.22, status: 'dispo' },
  { name: 'Tours', lon: 0.69, lat: 47.39, status: 'dispo' },
  { name: 'Orléans', lon: 1.91, lat: 47.9, status: 'dispo' },
  { name: 'Reims', lon: 4.03, lat: 49.26, status: 'dispo' },
  { name: 'Metz', lon: 6.18, lat: 49.12, status: 'dispo' },
  { name: 'Dijon', lon: 5.04, lat: 47.32, status: 'dispo' },
  { name: 'Limoges', lon: 1.26, lat: 45.83, status: 'dispo' },
  { name: 'Clermont-Ferrand', lon: 3.08, lat: 45.78, status: 'dispo' },
  { name: 'Grenoble', lon: 5.72, lat: 45.19, status: 'dispo' },
  { name: 'Toulouse', lon: 1.44, lat: 43.6, status: 'dispo' },
  { name: 'Montpellier', lon: 3.88, lat: 43.61, status: 'dispo' },
  { name: 'Nice', lon: 7.26, lat: 43.7, status: 'dispo' },
  { name: 'Ajaccio', lon: 8.74, lat: 41.92, status: 'dispo' },
];

/** Contour simplifié de la France métropolitaine (lon, lat) — tracé stylisé. */
export const MAINLAND: [number, number][] = [
  [2.55, 51.08], [3.2, 50.75], [4.2, 50.1], [4.85, 49.8], [5.8, 49.55], [6.4, 49.45], [7.0, 49.15], [8.2, 48.98],
  [7.6, 47.6], [7.0, 47.4], [6.1, 46.4], [6.8, 46.4], [7.0, 45.9], [6.7, 45.1], [7.1, 44.7], [6.9, 44.2],
  [7.5, 43.8], [6.6, 43.15], [5.4, 43.2], [4.6, 43.4], [3.6, 43.3], [3.05, 42.9], [3.15, 42.45], [1.7, 42.5],
  [0.7, 42.8], [-0.5, 42.8], [-1.75, 43.35], [-1.25, 44.6], [-1.15, 45.55], [-1.6, 46.3], [-2.15, 46.85],
  [-2.5, 47.3], [-3.4, 47.7], [-4.35, 47.85], [-4.75, 48.35], [-3.9, 48.75], [-3.0, 48.82], [-2.0, 48.62],
  [-1.55, 48.7], [-1.9, 49.7], [-1.25, 49.65], [-0.2, 49.3], [0.15, 49.5], [1.4, 50.08], [1.6, 50.9],
];
export const CORSICA: [number, number][] = [
  [9.4, 43.0], [9.55, 42.2], [9.25, 41.4], [8.75, 41.6], [8.55, 42.2], [8.7, 42.6], [9.3, 42.7],
];
