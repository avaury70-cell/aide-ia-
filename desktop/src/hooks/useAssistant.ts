import { useCallback, useEffect, useState } from "react";

import { api, ApiError } from "../api/client";
import type { ChatMessage } from "../api/types";
import type { OrbState } from "../components/Orb";
import { useHome } from "./useHome";
import { useSpeech, useVoice } from "./useVoice";

/** État conversationnel partagé entre les vues : messages, voix, orbe. */
export function useAssistant() {
  const { addPending, pushToast } = useHome();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [thinking, setThinking] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [draft, setDraft] = useState("");
  const [voiceReplies, setVoiceReplies] = useState(true);
  const speech = useSpeech();

  useEffect(() => {
    (async () => {
      try {
        const convs = await api.conversations();
        const conv = convs[0] ?? (await api.createConversation());
        setConversationId(conv.id);
        setMessages(await api.messages(conv.id));
      } catch {
        // serveur indisponible : la vue affiche l'état hors ligne
      }
    })();
  }, []);

  const send = useCallback(
    async (text: string, spoken = false) => {
      const content = text.trim();
      if (!content || !conversationId || thinking) return;
      setDraft("");
      setThinking(true);
      const temp: ChatMessage = {
        id: `tmp-${Date.now()}`,
        role: "user",
        content,
        tool_calls: [],
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, temp]);
      try {
        const reply = await api.sendMessage(conversationId, content);
        setMessages((prev) => [...prev.filter((m) => m.id !== temp.id), reply.user_message, reply.assistant_message]);
        if (reply.pending_actions.length) addPending(reply.pending_actions);
        if (spoken && voiceReplies) speech.speak(reply.assistant_message.content);
      } catch (e) {
        setMessages((prev) => prev.filter((m) => m.id !== temp.id));
        setDraft(content);
        pushToast("Message non envoyé", e instanceof ApiError ? e.message : "Erreur inconnue");
      } finally {
        setThinking(false);
      }
    },
    [conversationId, thinking, voiceReplies, speech, addPending, pushToast],
  );

  const voice = useVoice(async (audio) => {
    setTranscribing(true);
    try {
      const text = await api.transcribe(audio);
      if (text) await send(text, true);
      else pushToast("Je n'ai rien entendu", "Rapprochez-vous du micro et réessayez.");
    } catch (e) {
      pushToast("Reconnaissance vocale", e instanceof ApiError ? e.message : "Transcription impossible");
    } finally {
      setTranscribing(false);
    }
  });

  const toggleMic = useCallback(async () => {
    speech.cancel();
    try {
      await voice.toggle();
    } catch {
      pushToast("Micro inaccessible", "Autorisez l'accès au micro dans les réglages du système.");
    }
  }, [voice, speech, pushToast]);

  const newConversation = useCallback(async () => {
    const conv = await api.createConversation();
    setConversationId(conv.id);
    setMessages([]);
  }, []);

  const orbState: OrbState = voice.recording
    ? "listening"
    : thinking || transcribing
      ? "thinking"
      : speech.speaking
        ? "speaking"
        : "idle";

  return {
    messages,
    thinking: thinking || transcribing,
    draft,
    setDraft,
    send,
    toggleMic,
    recording: voice.recording,
    level: voice.level,
    orbState,
    voiceReplies,
    setVoiceReplies,
    newConversation,
  };
}

export type Assistant = ReturnType<typeof useAssistant>;
