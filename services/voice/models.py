from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class ModeRequest(BaseModel):
    mode: Literal["vulnerable", "camel"]


class TargetRequest(BaseModel):
    text: str = Field(min_length=1)
    attack_id: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class TargetResponse(BaseModel):
    mode: Literal["vulnerable", "camel"]
    response_text: str
    audio_url: str | None = None
    delivered_to_evaluator: bool = False
    used_llm: bool = False
    strategy: str


class TtsRenderRequest(BaseModel):
    text: str = Field(min_length=1)
    voice: str | None = None
    stem: str | None = None
    format: Literal["wav", "mp3"] = "wav"


class TtsRenderResponse(BaseModel):
    audio_url: str
    file_path: str
    provider: Literal["orpheus", "none"]
    voice: str
