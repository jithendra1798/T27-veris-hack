from __future__ import annotations

import asyncio
import io
import json
import shutil
import subprocess
import tempfile
import wave
from pathlib import Path
from typing import AsyncIterator

import httpx
import websockets

from services.voice.settings import VoiceSettings


class OrpheusTTSClient:
    def __init__(self, settings: VoiceSettings) -> None:
        self._settings = settings

    @property
    def enabled(self) -> bool:
        return bool(self._settings.tts_api_key and self._settings.orpheus_model_id)

    def _predict_url(self) -> str:
        return (
            f"https://model-{self._settings.orpheus_model_id}.api.baseten.co/"
            f"environments/{self._settings.orpheus_environment}/predict"
        )

    def _websocket_url(self) -> str:
        return (
            f"wss://model-{self._settings.orpheus_model_id}.api.baseten.co/"
            f"environments/{self._settings.orpheus_environment}/websocket"
        )

    async def stream_audio(
        self,
        text: str,
        *,
        voice: str | None = None,
        max_tokens: int = 2000,
        buffer_size: int = 5,
        retries: int = 3,
    ) -> AsyncIterator[bytes]:
        if not self.enabled:
            raise RuntimeError("Orpheus TTS is not configured")

        headers = {"Authorization": f"Api-Key {self._settings.tts_api_key}"}
        payload = json.dumps(
            {
                "voice": voice or self._settings.orpheus_voice,
                "max_tokens": max_tokens,
                "buffer_size": buffer_size,
            }
        )
        words = text.strip().split()
        if not words:
            return

        backoff = 0.5
        for attempt in range(1, retries + 1):
            try:
                async with websockets.connect(self._websocket_url(), additional_headers=headers) as websocket:
                    await websocket.send(payload)
                    for word in words:
                        await websocket.send(word)
                    await websocket.send("__END__")
                    async for chunk in websocket:
                        if isinstance(chunk, bytes):
                            yield chunk
                    return
            except Exception:
                if attempt == retries:
                    raise
                await asyncio.sleep(backoff)
                backoff *= 2

    async def synthesize_pcm(self, text: str, *, voice: str | None = None, max_tokens: int = 2000) -> bytes:
        if not self.enabled:
            raise RuntimeError("Orpheus TTS is not configured")

        headers = {"Authorization": f"Api-Key {self._settings.tts_api_key}"}
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                self._predict_url(),
                headers=headers,
                json={
                    "voice": voice or self._settings.orpheus_voice,
                    "prompt": text,
                    "max_tokens": max_tokens,
                },
            )
            response.raise_for_status()
            return response.content

    async def render_asset(
        self,
        text: str,
        *,
        output_dir: Path,
        stem: str,
        voice: str | None = None,
        audio_format: str = "wav",
    ) -> Path:
        pcm = await self.synthesize_pcm(text, voice=voice)
        output_dir.mkdir(parents=True, exist_ok=True)
        wav_path = output_dir / f"{stem}.wav"
        with wave.open(str(wav_path), "wb") as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(24000)
            wav_file.writeframes(pcm)

        if audio_format == "mp3" and shutil.which("ffmpeg"):
            mp3_path = output_dir / f"{stem}.mp3"
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as handle:
                temp_wav = Path(handle.name)
            temp_wav.write_bytes(wav_path.read_bytes())
            try:
                subprocess.run(
                    [
                        "ffmpeg",
                        "-y",
                        "-i",
                        str(temp_wav),
                        str(mp3_path),
                    ],
                    check=True,
                    capture_output=True,
                    text=True,
                )
                wav_path.unlink(missing_ok=True)
                return mp3_path
            finally:
                temp_wav.unlink(missing_ok=True)

        return wav_path


def pcm_to_wav_bytes(pcm: bytes) -> bytes:
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(24000)
        wav_file.writeframes(pcm)
    return buffer.getvalue()
