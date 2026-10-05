import { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { api } from "../api/client";
import type { Memory } from "../api/types";
import { colors, fonts } from "../config";
import { useAuth } from "../context/AuthContext";
import { registerForPush } from "../notifications";

const ROLE_LABELS = { admin: "Administrateur", member: "Membre", guest: "Invité" } as const;

export function SettingsScreen() {
  const { user, logout } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);

  const load = useCallback(async () => setMemories(await api.memories()), []);
  useEffect(() => {
    void load();
  }, [load]);

  const enablePush = async () => {
    try {
      const ok = await registerForPush();
      Alert.alert("Notifications", ok ? "Notifications activées." : "Autorisation refusée ou simulateur.");
    } catch {
      Alert.alert("Notifications", "Activation impossible.");
    }
  };

  const forget = async (m: Memory) => {
    await api.deleteMemory(m.id);
    setMemories((prev) => prev.filter((x) => x.id !== m.id));
  };

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 12 }}
      data={memories}
      keyExtractor={(m) => m.id}
      ListHeaderComponent={
        <View>
          <View style={styles.card}>
            <Text style={styles.name}>{user?.display_name}</Text>
            <Text style={styles.meta}>
              {user?.email} · {user ? ROLE_LABELS[user.role] : ""}
            </Text>
          </View>
          <Pressable style={styles.card} onPress={enablePush}>
            <Text style={styles.link}>🔔 Activer les notifications</Text>
          </Pressable>
          <Text style={styles.section}>{"// MÉMOIRE À LONG TERME"}</Text>
        </View>
      }
      ListEmptyComponent={<Text style={styles.meta}>Aucun souvenir enregistré.</Text>}
      renderItem={({ item }) => (
        <View style={[styles.card, styles.row]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text }}>{item.content}</Text>
            <Text style={styles.meta}>
              {item.category}
              {item.user_id === null ? " · partagé avec le foyer" : ""}
            </Text>
          </View>
          <Pressable onPress={() => void forget(item)}>
            <Text style={{ color: colors.danger }}>Oublier</Text>
          </Pressable>
        </View>
      )}
      ListFooterComponent={
        <Pressable style={[styles.card, { marginTop: 20 }]} onPress={() => void logout()}>
          <Text style={{ color: colors.danger, fontWeight: "600", textAlign: "center" }}>Se déconnecter</Text>
        </Pressable>
      }
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  name: { fontSize: 18, fontWeight: "700", color: colors.text },
  meta: { color: colors.muted, marginTop: 2, fontSize: 12, fontFamily: fonts.mono },
  link: { color: colors.primary, fontWeight: "600" },
  section: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 2, color: colors.primary, marginVertical: 8 },
});
