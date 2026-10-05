import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, fonts, glow } from "../config";

export function HudClock({ status }: { status: string }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const time = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const date = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }).toUpperCase();
  return (
    <View style={styles.box}>
      <Text style={styles.status}>◉ {status}</Text>
      <Text style={styles.time}>{time}</Text>
      <Text style={styles.date}>{date}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: "center", paddingTop: 8 },
  status: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 2, color: colors.success },
  time: { fontFamily: fonts.mono, fontSize: 34, fontWeight: "700", color: colors.text, textShadowColor: glow.shadowColor, textShadowRadius: 12 },
  date: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 2, color: colors.muted },
});
