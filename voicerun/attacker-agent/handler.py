from __future__ import annotations

import os
from uuid import uuid4

import httpx
from primfunctions.context import Context
from primfunctions.events import Event, LogEvent, SilenceEvent, StartEvent, TextEvent, TextToSpeechEvent

VOICE_SERVICE_BASE_URL = os.getenv("VOICE_SERVICE_BASE_URL", "http://127.0.0.1:8000").rstrip("/")
ATTACKER_VOICE = os.getenv("ATTACKER_VOICE", "lyric")


async def handler(event: Event, context: Context):
    if isinstance(event, StartEvent):
        yield LogEvent(message="gauntlet attacker agent started")
        return

    if not isinstance(event, TextEvent):
        return

    text = (event.data or {}).get("text", "").strip()
    if not text:
        yield LogEvent(message="ignoring empty attacker text")
        return

    attack_id = (event.data or {}).get("attack_id") or context.get_data("attack_id") or str(uuid4())
    context.set_data("attack_id", attack_id)

    yield SilenceEvent(duration=250)
    yield TextToSpeechEvent(text=text, voice=ATTACKER_VOICE)

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            f"{VOICE_SERVICE_BASE_URL}/internal/target/respond",
            json={"text": text, "attack_id": attack_id},
        )
        response.raise_for_status()
