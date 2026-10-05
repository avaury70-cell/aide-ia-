import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { ApiError } from "../api/client";
import { ArcOrb } from "../components/ArcOrb";
import { colors, fonts } from "../config";
import { useAuth } from "../context/AuthContext";

export function LoginScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "setup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      if (mode === "login") await login(email.trim(), password);
      else await register(email.trim(), password, name.trim());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Connexion impossible");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <ArcOrb state={busy ? "thinking" : "idle"} size={180} />
      <Text style={styles.logo}>A I D E</Text>
      <Text style={styles.subtitle}>
        {mode === "login" ? "Votre assistant domestique" : "Première installation : créez le compte administrateur"}
      </Text>
      {mode === "setup" && (
        <TextInput
          style={styles.input}
          placeholder="Prénom"
          placeholderTextColor={colors.muted}
          value={name}
          onChangeText={setName}
        />
      )}
      <TextInput
        style={styles.input}
        placeholder="E-mail"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Mot de passe (8 caractères min.)"
        placeholderTextColor={colors.muted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable style={styles.button} onPress={submit} disabled={busy}>
        {busy ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.buttonText}>
          {mode === "login" ? "INITIALISER LA SESSION" : "CRÉER LE COMPTE"}
        </Text>}
      </Pressable>
      <Pressable onPress={() => setMode(mode === "login" ? "setup" : "login")}>
        <Text style={styles.link}>
          {mode === "login" ? "Première utilisation ? Configurer" : "J'ai déjà un compte"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, gap: 12, backgroundColor: colors.background },
  logo: { fontSize: 30, fontWeight: "800", textAlign: "center", color: colors.text, fontFamily: fonts.mono, letterSpacing: 6 },
  subtitle: { textAlign: "center", color: colors.muted, marginBottom: 12, fontFamily: fonts.mono, fontSize: 12 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    paddingHorizontal: 14,
    height: 48,
    color: colors.text,
    fontFamily: fonts.mono,
  },
  error: { color: colors.danger, textAlign: "center" },
  button: { backgroundColor: colors.primary, borderRadius: 4, height: 48, alignItems: "center", justifyContent: "center" },
  buttonText: { color: colors.onPrimary, fontWeight: "700", fontSize: 14, fontFamily: fonts.mono, letterSpacing: 2 },
  link: { color: colors.primary, textAlign: "center", marginTop: 8, fontFamily: fonts.mono, fontSize: 12 },
});
