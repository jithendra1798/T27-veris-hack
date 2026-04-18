from __future__ import annotations

import argparse
import asyncio

from services.voice.settings import settings
from services.voice.tts import OrpheusTTSClient


async def render_attack_assets(items: list[str]) -> None:
    client = OrpheusTTSClient(settings)
    if not client.enabled:
        raise RuntimeError("Orpheus TTS is not configured")
    for index, text in enumerate(items, start=1):
        stem = f"attack-{index}"
        asset = await client.render_asset(text, output_dir=settings.audio_dir, stem=stem, audio_format="mp3")
        print(asset)


def main() -> None:
    parser = argparse.ArgumentParser(description="Render fallback attack audio assets")
    parser.add_argument("attack", nargs="+", help="Attack text snippets to render")
    args = parser.parse_args()
    asyncio.run(render_attack_assets(args.attack))


if __name__ == "__main__":
    main()
