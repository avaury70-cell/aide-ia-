import { useCallback, useEffect, useRef, useState } from "react";

const SPEECH_LEVEL = 0.035; // seuil RMS au-delà duquel on considère que l'utilisateur parle
const SILENCE_MS = 1400; // arrêt automatique après ce silence, une fois la parole détectée
const MAX_MS = 15_000;

/**
 * Enregistre la voix au micro (MediaRecorder), mesure le niveau sonore en continu
 * (pour animer l'orbe) et s'arrête seul en fin de phrase. Renvoie l'audio enregistré.
 */
export function useVoice(onRecorded: (audio: Blob) => void) {
  const [recording, setRecording] = useState(false);
  const [level, setLevel] = useState(0);
  const stopRef = useRef<(() => void) | null>(null);
  const callback = useRef(onRecorded);
  callback.current = onRecorded;

  const stop = useCallback(() => stopRef.current?.(), []);

  const start = useCallback(async () => {
    if (stopRef.current) return;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
    });
    const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "";
    const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    const chunks: Blob[] = [];
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    ctx.createMediaStreamSource(stream).connect(analyser);
    const buf = new Float32Array(analyser.fftSize);

    let spoke = false;
    let lastVoice = performance.now();
    const startedAt = performance.now();
    let raf = 0;
    let frame = 0;

    const tick = () => {
      analyser.getFloatTimeDomainData(buf);
      let sum = 0;
      for (const v of buf) sum += v * v;
      const rms = Math.sqrt(sum / buf.length);
      if (frame++ % 3 === 0) setLevel(Math.min(1, rms * 8)); // ~20 rafraîchissements/s suffisent
      const now = performance.now();
      if (rms > SPEECH_LEVEL) {
        spoke = true;
        lastVoice = now;
      }
      if ((spoke && now - lastVoice > SILENCE_MS) || now - startedAt > MAX_MS) {
        stopRef.current?.();
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    recorder.onstop = () => {
      cancelAnimationFrame(raf);
      stream.getTracks().forEach((t) => t.stop());
      void ctx.close();
      setLevel(0);
      setRecording(false);
      stopRef.current = null;
      if (spoke && chunks.length) callback.current(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
    };

    stopRef.current = () => {
      if (recorder.state !== "inactive") recorder.stop();
    };
    recorder.start(250);
    setRecording(true);
    raf = requestAnimationFrame(tick);
  }, []);

  const toggle = useCallback(async () => {
    if (stopRef.current) stop();
    else await start();
  }, [start, stop]);

  useEffect(() => () => stopRef.current?.(), []);

  return { recording, level, start, stop, toggle };
}

/** Synthèse vocale du système (voix françaises de Windows, macOS ou Linux). */
export function useSpeech() {
  const [speaking, setSpeaking] = useState(false);

  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "fr-FR";
    const voice = window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith("fr"));
    if (voice) u.voice = voice;
    u.rate = 1.05;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  }, []);

  const cancel = useCallback(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  return { speaking, speak, cancel };
}
