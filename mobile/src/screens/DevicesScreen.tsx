import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from "react-native";

import { api, ApiError } from "../api/client";
import type { Device } from "../api/types";
import { DeviceTile } from "../components/DeviceTile";
import { HudPanel, HudStat } from "../components/HudPanel";
import { colors, fonts } from "../config";
import { useAuth } from "../context/AuthContext";
import { useHomeEvents } from "../hooks/useHomeEvents";

export function DevicesScreen() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      setDevices(await api.devices());
    } catch (e) {
      Alert.alert("Erreur", e instanceof ApiError ? e.message : "Chargement impossible");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Mises à jour en direct depuis Home Assistant.
  useHomeEvents((event) => {
    if (event.type !== "state_changed") return;
    setDevices((prev) =>
      prev.map((d) =>
        d.entity_id === event.data.entity_id ? { ...d, state: event.data.state, attributes: event.data.attributes } : d,
      ),
    );
  });

  const sections = useMemo(() => {
    const groups = new Map<string, Device[]>();
    for (const d of devices.filter((x) => x.is_exposed)) {
      const key = d.room?.name ?? "Sans pièce";
      groups.set(key, [...(groups.get(key) ?? []), d]);
    }
    return [...groups.entries()]
      .sort(([a], [b]) => (a === "Sans pièce" ? 1 : b === "Sans pièce" ? -1 : a.localeCompare(b)))
      .map(([title, data]) => ({ title, data }));
  }, [devices]);

  const status = useMemo(() => {
    const temp = devices.find((d) => d.domain === "sensor" && d.device_class === "temperature");
    const humidity = devices.find((d) => d.domain === "sensor" && d.device_class === "humidity");
    const lightsOn = devices.filter((d) => d.domain === "light" && d.state === "on").length;
    const locks = devices.filter((d) => d.domain === "lock");
    const unlocked = locks.filter((d) => d.state !== "locked").length;
    const offline = devices.filter((d) => d.state === "unavailable").length;
    return { temp, humidity, lightsOn, locks: locks.length, unlocked, offline };
  }, [devices]);

  const runAction = async (device: Device, action: string) => {
    const exec = async () => {
      try {
        await api.deviceAction(device.entity_id, action);
      } catch (e) {
        Alert.alert("Commande refusée", e instanceof ApiError ? e.message : "Erreur");
      }
    };
    if (device.is_sensitive) {
      Alert.alert("Confirmer", `${action} — ${device.name} ?`, [
        { text: "Annuler", style: "cancel" },
        { text: "Confirmer", style: "destructive", onPress: () => void exec() },
      ]);
    } else {
      await exec();
    }
  };

  const sync = async () => {
    try {
      const res = await api.syncDevices();
      Alert.alert("Synchronisation", `${res.created} nouvel(s) appareil(s).`);
      await load();
    } catch (e) {
      Alert.alert("Erreur", e instanceof ApiError ? e.message : "Synchronisation impossible");
    }
  };

  return (
    <SectionList
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 12 }}
      sections={sections}
      keyExtractor={(d) => d.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
      ListHeaderComponent={
        <>
          <HudPanel title="ENVIRONNEMENT">
            <View style={styles.stats}>
              <HudStat label="TEMP." value={status.temp ? `${status.temp.state}°` : "—"} />
              <HudStat label="HUMIDITÉ" value={status.humidity ? `${status.humidity.state} %` : "—"} />
              <HudStat label="LUMIÈRES" value={String(status.lightsOn)} />
            </View>
          </HudPanel>
          <HudPanel title="SÉCURITÉ" accent={status.unlocked > 0}>
            <View style={styles.stats}>
              <HudStat
                label="ACCÈS"
                value={status.locks === 0 ? "—" : status.unlocked ? `${status.unlocked} OUVERT` : "FERMÉ"}
                tone={status.unlocked ? "warn" : "ok"}
              />
              <HudStat label="APPAREILS" value={String(devices.length)} />
              <HudStat label="HORS LIGNE" value={String(status.offline)} tone={status.offline ? "warn" : "ok"} />
            </View>
          </HudPanel>
        </>
      }
      renderSectionHeader={({ section }) => <Text style={styles.section}>{"// " + section.title.toUpperCase()}</Text>}
      renderItem={({ item }) => (
        <DeviceTile device={item} onAction={runAction} disabled={user?.role === "guest"} />
      )}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={{ color: colors.muted, fontFamily: fonts.mono }}>Aucun appareil. Synchronisez Home Assistant.</Text>
        </View>
      }
      ListFooterComponent={
        user?.role === "admin" ? (
          <Pressable style={styles.sync} onPress={sync}>
            <Text style={{ color: colors.primary, fontFamily: fonts.mono }}>[ ⟳ SYNCHRONISER HOME ASSISTANT ]</Text>
          </Pressable>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  section: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 2, color: colors.primary, marginVertical: 8 },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  empty: { padding: 40, alignItems: "center" },
  sync: { padding: 16, alignItems: "center" },
});
