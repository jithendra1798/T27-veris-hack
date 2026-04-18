# VoiceRun Projects

This repo includes two minimal VoiceRun projects for the BE2 demo:

- `voicerun/attacker-agent/` — speaks the attack text, then forwards it to the shared voice service
- `voicerun/target-agent/` — sends caller text to the shared voice service, then speaks the returned response

## Local flow

1. Start the shared service from the repo root:
   ```bash
   uvicorn services.voice.api:app --reload
   ```
2. In a second shell, deploy or test each VoiceRun project:
   ```bash
   cd voicerun/attacker-agent && vr push
   cd voicerun/target-agent && vr push
   ```
3. Set `VOICE_SERVICE_BASE_URL` if the FastAPI service is not running at `http://127.0.0.1:8000`.

## Environment

Both projects read these environment variables at runtime:

- `VOICE_SERVICE_BASE_URL` — base URL of the shared FastAPI voice service
- `ATTACKER_VOICE` — optional VoiceRun voice override for the attacker agent
- `TARGET_VOICE` — optional VoiceRun voice override for the target agent
