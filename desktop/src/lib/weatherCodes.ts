import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  type LucideIcon,
  Moon,
  Sun,
} from "lucide-react";

/** Codes météo WMO (Open-Meteo) → libellé français + icône. */
export function describeWeather(code: number, isDay = true): { label: string; icon: LucideIcon } {
  if (code === 0) return { label: "Ciel dégagé", icon: isDay ? Sun : Moon };
  if (code === 1) return { label: "Plutôt dégagé", icon: isDay ? CloudSun : CloudMoon };
  if (code === 2) return { label: "Partiellement nuageux", icon: isDay ? CloudSun : CloudMoon };
  if (code === 3) return { label: "Couvert", icon: Cloud };
  if (code === 45 || code === 48) return { label: "Brouillard", icon: CloudFog };
  if (code >= 51 && code <= 57) return { label: "Bruine", icon: CloudDrizzle };
  if (code >= 61 && code <= 67) return { label: code >= 65 ? "Forte pluie" : "Pluie", icon: CloudRain };
  if (code >= 71 && code <= 77) return { label: "Neige", icon: CloudSnow };
  if (code >= 80 && code <= 82) return { label: "Averses", icon: CloudRain };
  if (code === 85 || code === 86) return { label: "Averses de neige", icon: CloudSnow };
  if (code >= 95) return { label: "Orage", icon: CloudLightning };
  return { label: "Variable", icon: CloudSun };
}

/** Conseil de tenue simple à partir de la température ressentie et de la pluie. */
export function outfitTip(feelsLike: number, rainChance: number): string {
  const layer =
    feelsLike < 3 ? "manteau chaud, bonnet et gants" : feelsLike < 10 ? "manteau" : feelsLike < 17 ? "veste légère" : feelsLike < 24 ? "tenue légère" : "tenue d'été et eau";
  return rainChance >= 50 ? `${layer}, et un parapluie` : layer;
}
