import { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Switch, Text, View } from "react-native";

import { api, ApiError } from "../api/client";
import type { Automation } from "../api/types";
import { colors, fonts } from "../config";
import { useAuth } from "../context/AuthContext";

function describeTrigger(a: Automation): string {
  if (a.trigger.type === "time") return `⏰ Planifié (${a.trigger.cron})`;
  const to = a.trigger.to ? ` → ${a.trigger.to}` : "";
  return `⚡ Quand ${a.trigger.entity_id}${to}`;
}

export function AutomationsScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<Automation[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const canEdit = user?.role !== "guest";

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      setItems(await api.automations());
    } catch (e) {
      Alert.alert("Erreur", e instanceof ApiError ? e.message : "Chargement impossible");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = async (a: Automation, enabled: boolean) => {
    setItems((prev) => prev.map((x) => (x.id === a.id ? { ...x, enabled } : x)));
    try {
      await api.setAutomationEnabled(a.id, enabled);
    } catch {
      setItems((prev) => prev.map((x) => (x.id === a.id ? { ...x, enabled: !enabled } : x)));
    }
  };

  const runNow = async (a: Automation) => {
    try {
      const run = await api.runAutomation(a.id);
      Alert.alert(a.name, run.status === "success" ? "Exécutée ✓" : `Statut : ${run.status}`);
      await load();
    } catch (e) {
      Alert.alert("Erreur", e instanceof ApiError ? e.message : "Exécution impossible");
    }
  };

  const remove = (a: Automation) =>
    Alert.alert("Supprimer", `Supprimer « ${a.name} » ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          await api.deleteAutomation(a.id);
          setItems((prev) => prev.filter((x) => x.id !== a.id));
        },
      },
    ]);

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 12 }}
      data={items}
      keyExtractor={(a) => a.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
      ListHeaderComponent={
        <Text style={styles.hint}>
          Astuce : demandez à Aide « tous les soirs à 23 h, éteins tout » pour créer une automatisation.
        </Text>
      }
      ListEmptyComponent={<Text style={styles.empty}>Aucune automatisation pour l'instant.</Text>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>
                {item.name} {item.created_by === "assistant" ? "✨" : ""}
              </Text>
              <Text style={styles.meta}>{describeTrigger(item)}</Text>
              {item.description ? <Text style={styles.meta}>{item.description}</Text> : null}
              <Text style={styles.meta}>
                {item.actions.length} action(s)
                {item.last_run_at ? ` · dernière exécution ${new Date(item.last_run_at).toLocaleString("fr-FR")}` : ""}
              </Text>
            </View>
            <Switch trackColor={{ false: "#1b2a3a", true: colors.primary }} value={item.enabled} disabled={!canEdit} onValueChange={(v) => void toggle(item, v)} />
          </View>
          {canEdit && (
            <View style={styles.actions}>
              <Pressable onPress={() => void runNow(item)}>
                <Text style={styles.link}>▶ Exécuter</Text>
              </Pressable>
              <Pressable onPress={() => remove(item)}>
                <Text style={[styles.link, { color: colors.danger }]}>Supprimer</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  hint: { color: colors.muted, marginBottom: 12, fontFamily: fonts.mono, fontSize: 12 },
  empty: { color: colors.muted, textAlign: "center", marginTop: 40 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  name: { fontSize: 16, fontWeight: "600", color: colors.text },
  meta: { color: colors.muted, marginTop: 2, fontSize: 12, fontFamily: fonts.mono },
  actions: { flexDirection: "row", gap: 20, marginTop: 10 },
  link: { color: colors.primary, fontWeight: "600" },
});
