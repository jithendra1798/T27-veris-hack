from __future__ import annotations

from typing import Any

from openai import AsyncOpenAI

from services.voice.settings import VoiceSettings


class LLMClient:
    def __init__(self, settings: VoiceSettings) -> None:
        self._settings = settings
        self._client: AsyncOpenAI | None = None
        if settings.llm_api_key:
            kwargs: dict[str, Any] = {"api_key": settings.llm_api_key}
            if settings.llm_base_url:
                kwargs["base_url"] = settings.llm_base_url
            self._client = AsyncOpenAI(**kwargs)

    @property
    def enabled(self) -> bool:
        return self._client is not None

    async def complete(self, *, system_prompt: str, user_message: str) -> str:
        if not self._client:
            raise RuntimeError("LLM client is not configured")
        response = await self._client.chat.completions.create(
            model=self._settings.llm_model,
            temperature=self._settings.llm_temperature,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
        )
        message = response.choices[0].message.content or ""
        return message.strip()
