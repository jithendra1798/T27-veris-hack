from __future__ import annotations

import os

import httpx
from primfunctions.context import Context
from primfunctions.events import Event, LogEvent, StartEvent, TextEvent, TextToSpeechEvent, TimeoutEvent

VOICE_SERVICE_BASE_URL = os.getenv("VOICE_SERVICE_BASE_URL", "http://127.0.0.1:8000").rstrip("/")
TARGET_VOICE = os.getenv("TARGET_VOICE", "nova")


async def handler(event: Event, context: Context):
    if isinstance(event, StartEvent):
        yield LogEvent(message="gauntlet target agent started")
        yield TextToSpeechEvent(
            text="Thanks for calling AcmeTel support. How can I help today?",
            voice=TARGET_VOICE,
        )
        return

    if isinstance(event, TimeoutEvent):
        yield TextToSpeechEvent(
            text="I'm still here if you want to continue.",
            voice=TARGET_VOICE,
        )
        return

    if not isinstance(event, TextEvent):
        return

    text = (event.data or {}).get("text", "").strip()
    if not text:
        yield LogEvent(message="ignoring empty target text")
        return

    attack_id = (event.data or {}).get("attack_id") or context.get_data("attack_id")
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(
            f"{VOICE_SERVICE_BASE_URL}/internal/target/respond",
            json={"text": text, "attack_id": attack_id},
        )
        response.raise_for_status()
        payload = response.json()

    context.set_data("last_mode", payload.get("mode"))
    context.set_data("last_response", payload.get("response_text", ""))
    yield TextToSpeechEvent(text=payload.get("response_text", ""), voice=TARGET_VOICE)
