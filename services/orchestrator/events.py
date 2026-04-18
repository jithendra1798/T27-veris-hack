"""
In-memory event bus for SSE streaming.

Events are stored in a list and new subscribers get all historical events
on connect, then receive new events as they arrive via asyncio.Condition.
"""

import asyncio
import json
from typing import AsyncGenerator


class EventBus:
    """Thread-safe, async event bus for SSE broadcasting."""

    def __init__(self) -> None:
        self._events: list[dict] = []
        self._condition = asyncio.Condition()

    async def emit(self, event: dict) -> None:
        """Publish an event to all waiting subscribers."""
        async with self._condition:
            self._events.append(event)
            self._condition.notify_all()

    async def subscribe(self) -> AsyncGenerator[str, None]:
        """
        Yields SSE-formatted strings.

        On connect, replays all past events, then waits for new ones.
        """
        cursor = 0
        while True:
            async with self._condition:
                # Wait until there are new events beyond our cursor
                while cursor >= len(self._events):
                    await self._condition.wait()

                # Yield all new events since our cursor
                new_events = self._events[cursor:]
                cursor = len(self._events)

            for event in new_events:
                yield f"data: {json.dumps(event)}\n\n"

    def reset(self) -> None:
        """Clear all events (e.g. between demo runs)."""
        self._events.clear()

    @property
    def history(self) -> list[dict]:
        """Return a copy of all stored events."""
        return list(self._events)


# Singleton used across the app
event_bus = EventBus()
