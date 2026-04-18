from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[2]


@dataclass(slots=True)
class VoiceSettings:
    llm_api_key: str | None
    llm_base_url: str | None
    llm_model: str
    llm_temperature: float
    tts_api_key: str | None
    orpheus_model_id: str | None
    orpheus_environment: str
    orpheus_voice: str
    attacker_voice: str
    target_voice: str
    playback_mode: str
    response_strategy: str
    evaluator_response_url: str | None
    target_response_url: str
    static_base_url: str
    prompt_dir: Path
    audio_dir: Path

    @classmethod
    def from_env(cls) -> "VoiceSettings":
        static_base_url = os.getenv("VOICE_STATIC_BASE_URL", "http://127.0.0.1:8000").rstrip("/")
        return cls(
            llm_api_key=os.getenv("VOICE_LLM_API_KEY") or os.getenv("OPENAI_API_KEY") or os.getenv("BASETEN_API_KEY"),
            llm_base_url=os.getenv("VOICE_LLM_BASE_URL"),
            llm_model=os.getenv("VOICE_LLM_MODEL", "gpt-4.1-mini"),
            llm_temperature=float(os.getenv("VOICE_LLM_TEMPERATURE", "0.2")),
            tts_api_key=os.getenv("BASETEN_API_KEY"),
            orpheus_model_id=os.getenv("BASETEN_ORPHEUS_MODEL_ID") or os.getenv("ORPHEUS_MODEL_ID"),
            orpheus_environment=os.getenv("ORPHEUS_ENVIRONMENT", "production"),
            orpheus_voice=os.getenv("ORPHEUS_VOICE", "tara"),
            attacker_voice=os.getenv("ATTACKER_VOICE", "lyric"),
            target_voice=os.getenv("TARGET_VOICE", "nova"),
            playback_mode=os.getenv("VOICE_PLAYBACK_MODE", "voicerun"),
            response_strategy=os.getenv("VOICE_RESPONSE_STRATEGY", "auto"),
            evaluator_response_url=os.getenv("EVALUATOR_RESPONSE_URL"),
            target_response_url=os.getenv(
                "TARGET_RESPONSE_URL",
                "http://127.0.0.1:8000/internal/target/respond",
            ),
            static_base_url=static_base_url,
            prompt_dir=ROOT_DIR / "docs" / "prompts",
            audio_dir=ROOT_DIR / "assets" / "audio",
        )


settings = VoiceSettings.from_env()
