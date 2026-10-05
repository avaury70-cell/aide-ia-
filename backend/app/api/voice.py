from fastapi import APIRouter, Depends, HTTPException, UploadFile

from ..config import get_settings
from ..models import User
from ..security import current_user
from ..services.speech import SpeechUnavailableError, transcribe

router = APIRouter(prefix="/voice", tags=["voix"])


@router.post("/transcribe")
async def transcribe_audio(audio: UploadFile, _: User = Depends(current_user)) -> dict[str, str]:
    """Reçoit un enregistrement (webm/opus, wav, mp3…) et renvoie le texte reconnu."""
    data = await audio.read(get_settings().voice_max_bytes + 1)
    if len(data) > get_settings().voice_max_bytes:
        raise HTTPException(413, "Enregistrement trop long")
    if not data:
        raise HTTPException(400, "Enregistrement vide")
    try:
        text = await transcribe(data, language="fr")
    except SpeechUnavailableError as exc:
        raise HTTPException(503, str(exc)) from exc
    except Exception as exc:  # fichier audio illisible, etc.
        raise HTTPException(422, "Audio illisible") from exc
    return {"text": text}
