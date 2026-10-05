"""Transcription vocale locale (Whisper via faster-whisper) : l'audio ne quitte pas le domicile."""

import asyncio
import io
import logging
from typing import Protocol

from ..config import get_settings

log = logging.getLogger(__name__)


class SpeechUnavailableError(RuntimeError):
    pass


class Transcriber(Protocol):
    def transcribe(self, audio: bytes, language: str) -> str: ...


class WhisperTranscriber:
    def __init__(self, model_size: str, device: str, compute_type: str) -> None:
        try:
            from faster_whisper import WhisperModel
        except ImportError as exc:  # dépendance optionnelle (requirements-voice.txt)
            raise SpeechUnavailableError(
                "Transcription indisponible : installez requirements-voice.txt (faster-whisper)"
            ) from exc
        log.info("Chargement du modèle Whisper '%s' (%s/%s)…", model_size, device, compute_type)
        self._model = WhisperModel(model_size, device=device, compute_type=compute_type)

    def transcribe(self, audio: bytes, language: str) -> str:
        # vad_filter supprime les silences ; beam_size réduit pour la latence.
        segments, _ = self._model.transcribe(io.BytesIO(audio), language=language, beam_size=1, vad_filter=True)
        return " ".join(seg.text.strip() for seg in segments).strip()


_transcriber: Transcriber | None = None
_lock = asyncio.Lock()


async def get_transcriber() -> Transcriber:
    global _transcriber
    async with _lock:  # un seul chargement du modèle, même sous requêtes concurrentes
        if _transcriber is None:
            s = get_settings()
            _transcriber = await asyncio.to_thread(
                WhisperTranscriber, s.whisper_model, s.whisper_device, s.whisper_compute_type
            )
    return _transcriber


def set_transcriber(transcriber: Transcriber | None) -> None:
    global _transcriber
    _transcriber = transcriber


async def transcribe(audio: bytes, language: str = "fr") -> str:
    transcriber = await get_transcriber()
    return await asyncio.to_thread(transcriber.transcribe, audio, language)
