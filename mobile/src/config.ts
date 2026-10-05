import Constants from "expo-constants";
import { Platform } from "react-native";

// URL du backend sur le réseau local (ou via VPN / tunnel sécurisé hors du domicile).
export const API_URL: string =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? "http://localhost:8000";

export const WS_URL = API_URL.replace(/^http/, "ws");

// Thème « HUD holographique » : fond nuit, lignes cyan lumineuses, accents orange.
export const colors = {
  primary: "#3fd0ff",
  primaryDim: "rgba(63, 208, 255, 0.15)",
  accent: "#ff9a3c",
  danger: "#ff4d5e",
  success: "#3dffa8",
  text: "#d8f3ff",
  muted: "#6f8ea8",
  background: "#03070d",
  card: "rgba(9, 28, 46, 0.78)",
  border: "rgba(63, 208, 255, 0.35)",
  onPrimary: "#03070d",
};

export const fonts = {
  // Police à chasse fixe pour l'effet « console » des libellés HUD.
  mono: Platform.select({ ios: "Menlo", default: "monospace" }),
};

export const glow = {
  shadowColor: colors.primary,
  shadowOpacity: 0.6,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 0 },
  elevation: 6,
};
