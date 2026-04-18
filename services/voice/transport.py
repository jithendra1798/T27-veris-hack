from __future__ import annotations

from typing import Any

import httpx


async def post_json(url: str | None, payload: dict[str, Any], *, timeout: float = 10.0) -> bool:
    if not url:
        return False
    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.post(url, json=payload)
        response.raise_for_status()
    return True
