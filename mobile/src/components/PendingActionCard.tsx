import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { api, ApiError } from "../api/client";
import type { PendingAction } from "../api/types";
import { colors, fonts } from "../config";

/** Validation humaine d'une action sensible proposée par l'assistant (serrure, alarme…). */
export function PendingActionCard({ action, onResolved }: { action: PendingAction; onResolved: (id: string) => void }) {
  const [busy, setBusy] = useState(false);

  const resolve = async (approve: boolean) => {
    setBusy(true);
    try {
      await (approve ? api.confirmAction(action.id) : api.rejectAction(action.id));
      onResolved(action.id);
    } catch (e) {
      Alert.alert("Action impossible", e instanceof ApiError ? e.message : "Erreur inconnue");
      onResolved(action.id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>⚠ AUTORISATION REQUISE</Text>
      <Text style={styles.summary}>{action.summary}</Text>
      <Text style={styles.entity}>{action.entity_id}</Text>
      <View style={styles.row}>
        <Pressable style={[styles.button, styles.reject]} disabled={busy} onPress={() => void resolve(false)}>
          <Text style={styles.rejectText}>REFUSER</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.confirm]} disabled={busy} onPress={() => void resolve(true)}>
          <Text style={styles.confirmText}>AUTORISER</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 12,
    marginBottom: 0,
    padding: 14,
    borderRadius: 4,
    backgroundColor: "rgba(255, 154, 60, 0.12)",
    borderWidth: 1,
    borderColor: colors.accent,
  },
  title: { fontFamily: fonts.mono, letterSpacing: 2, fontSize: 12, fontWeight: "700", color: colors.accent },
  summary: { marginTop: 4, fontSize: 16, color: colors.text },
  entity: { marginTop: 2, fontSize: 11, color: colors.muted, fontFamily: fonts.mono },
  row: { flexDirection: "row", gap: 10, marginTop: 12 },
  button: { flex: 1, borderRadius: 4, paddingVertical: 10, alignItems: "center" },
  reject: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  confirm: { backgroundColor: colors.danger },
  rejectText: { color: colors.text, fontFamily: fonts.mono, letterSpacing: 1 },
  confirmText: { color: "#fff", fontFamily: fonts.mono, letterSpacing: 1, fontWeight: "700" },
});
