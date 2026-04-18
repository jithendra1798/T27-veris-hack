from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from typing import Any


@dataclass(slots=True)
class Event:
    data: dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class StartEvent(Event):
    pass


@dataclass(slots=True)
class TextEvent(Event):
    pass


@dataclass(slots=True)
class TimeoutEvent(Event):
    pass


@dataclass(slots=True)
class StopEvent(Event):
    closing_speech: str | None = None
    voice: str | None = None
    speed: float | None = None
    language: str | None = None


@dataclass(slots=True)
class TextToSpeechEvent(Event):
    text: str = ""
    voice: str | None = None
    instructions: str | None = None
    speed: float | None = None
    cache: bool = True
    stream: bool = True
    interruptible: bool = True
    model: str | None = None


@dataclass(slots=True)
class AudioEvent(Event):
    path: str = ""


@dataclass(slots=True)
class LogEvent(Event):
    message: str = ""


@dataclass(slots=True)
class SilenceEvent(Event):
    duration: int = 0


class Context:
    def __init__(self, *, variables: dict[str, Any] | None = None, data: dict[str, Any] | None = None) -> None:
        self.variables = variables or {}
        self._data = data or {}
        self._tasks: list[asyncio.Task[Any]] = []

    def get_data(self, key: str, default: Any = None) -> Any:
        return self._data.get(key, default)

    def set_data(self, key: str, value: Any) -> None:
        self._data[key] = value

    def create_task(self, coro: Any) -> asyncio.Task[Any]:
        task = asyncio.create_task(coro)
        self._tasks.append(task)
        return task
