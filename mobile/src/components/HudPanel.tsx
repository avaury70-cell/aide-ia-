import type { ReactNode } from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { colors, fonts } from "../config";

/** Panneau translucide à coins en équerre, façon affichage tête haute. */
export function HudPanel({ title, children, style, accent }: {
  title?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  accent?: boolean;
}) {
  const edge = accent ? colors.accent : colors.primary;
  return (
    <View style={[styles.panel, style]}>
      <View style={[styles.corner, styles.tl, { borderColor: edge }]} />
      <View style={[styles.corner, styles.tr, { borderColor: edge }]} />
      <View style={[styles.corner, styles.bl, { borderColor: edge }]} />
      <View style={[styles.corner, styles.br, { borderColor: edge }]} />
      {title ? <Text style={[styles.title, { color: edge }]}>{title}</Text> : null}
      {children}
    </View>
  );
}

export function HudStat({ label, value, tone }: { label: string; value: string; tone?: "ok" | "warn" }) {
  const color = tone === "warn" ? colors.accent : tone === "ok" ? colors.success : colors.text;
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

const C = 12;
const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
  },
  corner: { position: "absolute", width: C, height: C },
  tl: { top: -1, left: -1, borderTopWidth: 2, borderLeftWidth: 2 },
  tr: { top: -1, right: -1, borderTopWidth: 2, borderRightWidth: 2 },
  bl: { bottom: -1, left: -1, borderBottomWidth: 2, borderLeftWidth: 2 },
  br: { bottom: -1, right: -1, borderBottomWidth: 2, borderRightWidth: 2 },
  title: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 2, marginBottom: 8, fontWeight: "700" },
  stat: { flex: 1, minWidth: 90 },
  statLabel: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.5, color: colors.muted },
  statValue: { fontFamily: fonts.mono, fontSize: 18, fontWeight: "700", marginTop: 2 },
});
