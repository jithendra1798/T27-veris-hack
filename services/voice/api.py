from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles

from services.voice.models import ModeRequest, TargetRequest, TargetResponse, TtsRenderRequest, TtsRenderResponse
from services.voice.service import default_runtime, stable_stem
from services.voice.settings import settings
from services.voice.tts import OrpheusTTSClient


app = FastAPI(title="GAUNTLET Voice Service", version="0.1.0")
app.mount("/assets", StaticFiles(directory=settings.audio_dir.parent), name="assets")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "mode": await default_runtime.get_mode()}


@app.post("/target/mode")
async def set_target_mode(body: ModeRequest) -> dict[str, str]:
    mode = await default_runtime.set_mode(body.mode)
    return {"mode": mode}


@app.post("/internal/target/respond", response_model=TargetResponse)
async def target_respond(body: TargetRequest) -> TargetResponse:
    return await default_runtime.build_target_response(body)


@app.post("/tts/render", response_model=TtsRenderResponse)
async def render_tts(body: TtsRenderRequest) -> TtsRenderResponse:
    client = OrpheusTTSClient(settings)
    if not client.enabled:
        raise HTTPException(status_code=503, detail="Orpheus TTS is not configured")
    stem = body.stem or stable_stem(body.text)
    asset = await client.render_asset(
        body.text,
        output_dir=settings.audio_dir,
        stem=stem,
        voice=body.voice,
        audio_format=body.format,
    )
    relative = asset.relative_to(settings.audio_dir.parent.parent)
    return TtsRenderResponse(
        audio_url=f"{settings.static_base_url}/{relative.as_posix()}",
        file_path=str(asset),
        provider="orpheus",
        voice=body.voice or settings.orpheus_voice,
    )
