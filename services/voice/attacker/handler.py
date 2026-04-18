from __future__ import annotations

from typing import AsyncIterator
from uuid import uuid4

import httpx

try:
    from primfunctions.context import Context
    from primfunctions.events import AudioEvent, Event, LogEvent, SilenceEvent, StartEvent, TextEvent, TextToSpeechEvent
except ImportError:
    from services.voice.compat import AudioEvent, Context, Event, LogEvent, SilenceEvent, StartEvent, TextEvent, TextToSpeechEvent

from services.voice.models import TargetRequest
from services.voice.settings import settings


async def handler(event: Event, context: Context) -> AsyncIterator[Event]:
    if isinstance(event, StartEvent):
        yield LogEvent(message="attacker session started")
        return

    if isinstance(event, TextEvent):
        text = (event.data or {}).get("text", "").strip()
        if not text:
            yield LogEvent(message="ignoring empty attacker text")
            return

        attack_id = (event.data or {}).get("attack_id") or context.get_data("attack_id") or str(uuid4())
        context.set_data("attack_id", attack_id)

        yield SilenceEvent(duration=250)
        if settings.playback_mode == "audio_url":
            audio_url = await _render_audio_url(text, attack_id)
            if audio_url:
                yield AudioEvent(path=audio_url)
            else:
                yield TextToSpeechEvent(text=text, voice=settings.attacker_voice)
        else:
            yield TextToSpeechEvent(text=text, voice=settings.attacker_voice)

        await _forward_to_target(TargetRequest(text=text, attack_id=attack_id).model_dump())


async def _render_audio_url(text: str, attack_id: str) -> str | None:
    render_url = settings.target_response_url.replace("/internal/target/respond", "/tts/render")
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(render_url, json={"text": text, "stem": f"attack-{attack_id}", "format": "mp3"})
        if response.is_success:
            return response.json().get("audio_url")
    return None


async def _forward_to_target(payload: dict[str, str]) -> None:
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(settings.target_response_url, json=payload)
        response.raise_for_status()
