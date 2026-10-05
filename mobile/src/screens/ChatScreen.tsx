import * as Speech from "expo-speech";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, ApiError } from "../api/client";
import type { ChatMessage, PendingAction } from "../api/types";
import { ArcOrb, type OrbState } from "../components/ArcOrb";
import { HudClock } from "../components/HudClock";
import { PendingActionCard } from "../components/PendingActionCard";
import { colors, fonts } from "../config";
import { useHomeEvents } from "../hooks/useHomeEvents";

const SUGGESTIONS = ["Quelle température fait-il dans le salon ?", "Éteins toutes les lumières", "Mode cinéma"];

export function ChatScreen() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState<PendingAction[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceReplies, setVoiceReplies] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const insets = useSafeAreaInsets();

  // Reprend la conversation la plus récente, ou en crée une.
  useEffect(() => {
    (async () => {
      try {
        const convs = await api.conversations();
        const conv = convs[0] ?? (await api.createConversation());
        setConversationId(conv.id);
        setMessages(await api.messages(conv.id));
        setPending(await api.pendingActions());
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Erreur de chargement");
      }
    })();
  }, []);

  useHomeEvents((event) => {
    if (event.type === "pending_action") void api.pendingActions().then(setPending);
  });

  const send = useCallback(
    async (text: string, spoken = false) => {
      const content = text.trim();
      if (!content || !conversationId || sending) return;
      setInput("");
      setError(null);
      setSending(true);
      const optimistic: ChatMessage = {
        id: `local-${Date.now()}`,
        role: "user",
        content,
        tool_calls: [],
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);
      try {
        const reply = await api.sendMessage(conversationId, content);
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== optimistic.id),
          reply.user_message,
          reply.assistant_message,
        ]);
        if (reply.pending_actions.length) setPending((prev) => [...reply.pending_actions, ...prev]);
        if (spoken && voiceReplies) {
          Speech.speak(reply.assistant_message.content, {
            language: "fr-FR",
            onStart: () => setSpeaking(true),
            onDone: () => setSpeaking(false),
            onStopped: () => setSpeaking(false),
            onError: () => setSpeaking(false),
          });
        }
      } catch (e) {
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        setInput(content);
        setError(e instanceof ApiError ? e.message : "Envoi impossible");
      } finally {
        setSending(false);
      }
    },
    [conversationId, sending, voiceReplies],
  );

  // --- Reconnaissance vocale -------------------------------------------------
  useSpeechRecognitionEvent("result", (event) => {
    const transcript = event.results[0]?.transcript ?? "";
    setInput(transcript);
    if (event.isFinal) void send(transcript, true);
  });
  useSpeechRecognitionEvent("end", () => setListening(false));
  useSpeechRecognitionEvent("error", (event) => {
    setListening(false);
    if (event.error !== "no-speech") setError(`Micro : ${event.message}`);
  });

  const toggleMic = async () => {
    if (listening) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }
    const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!perm.granted) {
      setError("Autorisez le micro dans les réglages pour parler à Aide.");
      return;
    }
    Speech.stop();
    setSpeaking(false);
    ExpoSpeechRecognitionModule.start({ lang: "fr-FR", interimResults: true });
    setListening(true);
  };

  const newConversation = async () => {
    const conv = await api.createConversation();
    setConversationId(conv.id);
    setMessages([]);
  };

  const resolvePending = (id: string) => setPending((prev) => prev.filter((p) => p.id !== id));

  const orbState: OrbState = listening ? "listening" : sending ? "thinking" : speaking ? "speaking" : "idle";
  const STATUS: Record<OrbState, string> = {
    idle: "EN LIGNE",
    listening: "ÉCOUTE…",
    thinking: "ANALYSE…",
    speaking: "RÉPONSE VOCALE",
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <HudClock status={STATUS[orbState]} />
      <ArcOrb state={orbState} onPress={toggleMic} size={messages.length ? 150 : 240} />
      <View style={styles.toolbar}>
        <Pressable onPress={newConversation}>
          <Text style={styles.link}>[ + NOUVELLE SESSION ]</Text>
        </Pressable>
        <Pressable onPress={() => setVoiceReplies((v) => !v)}>
          <Text style={styles.link}>{voiceReplies ? "[ VOIX : ON ]" : "[ VOIX : OFF ]"}</Text>
        </Pressable>
      </View>

      {pending.map((p) => (
        <PendingActionCard key={p.id} action={p} onResolved={resolvePending} />
      ))}

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.muted}>Touchez le noyau pour parler, ou choisissez une commande :</Text>
            {SUGGESTIONS.map((s) => (
              <Pressable key={s} style={styles.suggestion} onPress={() => void send(s)}>
                <Text style={styles.suggestionText}>› {s}</Text>
              </Pressable>
            ))}
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.role === "user" ? styles.userBubble : styles.botBubble]}>
            <Text style={styles.speaker}>{item.role === "user" ? "VOUS" : "AIDE"}</Text>
            <Text style={item.role === "user" ? styles.userText : styles.botText}>{item.content}</Text>
            {item.tool_calls.length > 0 && (
              <Text style={styles.toolTrace}>
                {item.tool_calls.map((t) => `${t.is_error ? "⚠️" : "✓"} ${t.name}`).join("  ")}
              </Text>
            )}
          </View>
        )}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.inputRow}>
        <Pressable style={[styles.mic, listening && styles.micActive]} onPress={toggleMic}>
          <Text style={{ fontSize: 20, color: colors.primary }}>{listening ? "■" : "🎙"}</Text>
        </Pressable>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder={listening ? "Je vous écoute…" : "Saisir une commande…"}
          placeholderTextColor={colors.muted}
          onSubmitEditing={() => void send(input)}
          returnKeyType="send"
          editable={!sending}
        />
        <Pressable style={styles.send} onPress={() => void send(input)} disabled={sending}>
          <Text style={styles.sendText}>▶</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  toolbar: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 6 },
  link: { color: colors.primary, fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1 },
  list: { padding: 12, flexGrow: 1 },
  empty: { alignItems: "center", gap: 8, paddingTop: 8 },
  muted: { color: colors.muted, textAlign: "center", fontFamily: fonts.mono, fontSize: 12 },
  suggestion: {
    alignSelf: "stretch",
    backgroundColor: colors.primaryDim,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  suggestionText: { color: colors.text, fontFamily: fonts.mono, fontSize: 13 },
  bubble: { maxWidth: "88%", padding: 10, borderRadius: 4, marginVertical: 4, borderWidth: 1 },
  userBubble: { alignSelf: "flex-end", backgroundColor: "rgba(255, 154, 60, 0.12)", borderColor: "rgba(255, 154, 60, 0.5)" },
  botBubble: { alignSelf: "flex-start", backgroundColor: colors.card, borderColor: colors.border },
  speaker: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 2, color: colors.muted, marginBottom: 2 },
  userText: { color: colors.text, fontSize: 15 },
  botText: { color: colors.text, fontSize: 15 },
  toolTrace: { marginTop: 6, fontSize: 10, color: colors.primary, fontFamily: fonts.mono },
  error: { color: colors.danger, textAlign: "center", marginBottom: 6, fontFamily: fonts.mono, fontSize: 12 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: "rgba(3, 7, 13, 0.95)",
  },
  mic: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.primaryDim,
  },
  micActive: { borderColor: colors.danger, backgroundColor: "rgba(255, 77, 94, 0.2)" },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    paddingHorizontal: 12,
    height: 44,
    color: colors.text,
    fontFamily: fonts.mono,
    backgroundColor: colors.card,
  },
  send: { backgroundColor: colors.primary, borderRadius: 4, width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  sendText: { color: colors.onPrimary, fontWeight: "700", fontSize: 16 },
});
