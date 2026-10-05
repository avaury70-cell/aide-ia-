import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

import type { Device } from "../api/types";
import { colors, fonts } from "../config";

const ICONS: Record<string, string> = {
  light: "💡", switch: "🔌", climate: "🌡️", cover: "🪟", lock: "🔒", sensor: "📟",
  binary_sensor: "🚪", media_player: "🔈", fan: "🌀", vacuum: "🧹", scene: "🎬",
  script: "📜", alarm_control_panel: "🚨", weather: "⛅", person: "🧑", valve: "🚰",
};

const TOGGLABLE = new Set(["light", "switch", "fan", "input_boolean", "media_player"]);

export function formatState(device: Device): string {
  const unit = device.attributes.unit_of_measurement;
  if (device.domain === "climate") {
    const current = device.attributes.current_temperature;
    const target = device.attributes.temperature;
    return `${current ?? "?"}° → ${target ?? "?"}°`;
  }
  if (device.domain === "light" && device.state === "on" && typeof device.attributes.brightness === "number") {
    return `${Math.round((device.attributes.brightness / 255) * 100)} %`;
  }
  const labels: Record<string, string> = {
    on: "Allumé", off: "Éteint", locked: "Verrouillé", unlocked: "Déverrouillé",
    open: "Ouvert", closed: "Fermé", home: "Présent", not_home: "Absent", unavailable: "Indisponible",
  };
  const state = device.state ?? "?";
  return labels[state] ?? `${state}${unit ? ` ${String(unit)}` : ""}`;
}

interface Props {
  device: Device;
  onAction: (device: Device, action: string) => void;
  disabled?: boolean;
}

export function DeviceTile({ device, onAction, disabled }: Props) {
  const isOn = device.state === "on" || device.state === "playing";
  return (
    <View style={styles.tile}>
      <Text style={styles.icon}>{ICONS[device.domain] ?? "•"}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.name} numberOfLines={1}>
          {device.name} {device.is_sensitive ? "🔐" : ""}
        </Text>
        <Text style={styles.state}>{formatState(device)}</Text>
      </View>
      {TOGGLABLE.has(device.domain) && (
        <Switch
          trackColor={{ false: "#1b2a3a", true: colors.primary }}
          thumbColor={isOn ? "#ffffff" : colors.muted}
          value={isOn}
          disabled={disabled || device.state === "unavailable"}
          onValueChange={(v) => onAction(device, v ? "turn_on" : "turn_off")}
        />
      )}
      {device.domain === "cover" && (
        <View style={styles.buttons}>
          <Pressable style={styles.small} disabled={disabled} onPress={() => onAction(device, "open")}>
            <Text style={styles.btnText}>▲</Text>
          </Pressable>
          <Pressable style={styles.small} disabled={disabled} onPress={() => onAction(device, "close")}>
            <Text style={styles.btnText}>▼</Text>
          </Pressable>
        </View>
      )}
      {device.domain === "lock" && (
        <Pressable
          style={styles.small}
          disabled={disabled}
          onPress={() => onAction(device, device.state === "locked" ? "unlock" : "lock")}
        >
          <Text style={styles.btnText}>{device.state === "locked" ? "OUVRIR" : "VERROUILLER"}</Text>
        </Pressable>
      )}
      {(device.domain === "scene" || device.domain === "script") && (
        <Pressable style={styles.small} disabled={disabled} onPress={() => onAction(device, "activate")}>
          <Text style={styles.btnText}>LANCER</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    backgroundColor: colors.card,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  icon: { fontSize: 24 },
  name: { fontSize: 16, fontWeight: "600", color: colors.text },
  state: { color: colors.primary, marginTop: 2, fontFamily: fonts.mono, fontSize: 12 },
  btnText: { color: colors.primary, fontFamily: fonts.mono, fontSize: 12 },
  buttons: { flexDirection: "row", gap: 6 },
  small: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: colors.primaryDim,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
