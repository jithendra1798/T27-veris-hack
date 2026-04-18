"""
GAUNTLET Orchestrator — FastAPI service (BE1)

Endpoints:
  GET  /events              — SSE stream of all attack/verdict/report events
  POST /attack/run          — Trigger an attack run (judge picks attack)
  POST /evaluator/response  — BE2 posts target responses here
  POST /reset               — Reset state for a new demo run
  GET  /health              — Health check
"""

import asyncio
import os
import uuid
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from dotenv import load_dotenv
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from .attacker import fire_attack, get_scenarios_for_class, load_scenarios, reload_scenarios
from .evaluator import evaluate_response, store_attack
from .events import event_bus
from .reporter import add_verdict, generate_report, reset_verdicts

# ---------------------------------------------------------------------------
# Load environment
# ---------------------------------------------------------------------------
load_dotenv()

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
BE2_ATTACKER_URL = os.getenv("BE2_ATTACKER_URL", "http://localhost:8001/attacker/attack")
BE2_TARGET_MODE_URL = os.getenv("BE2_TARGET_MODE_URL", "http://localhost:8001/target/mode")


# ---------------------------------------------------------------------------
# App lifecycle
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: pre-load scenarios
    scenarios = load_scenarios()
    print(f"[orchestrator] Loaded {len(scenarios)} attack scenarios")
    yield
    # Shutdown
    print("[orchestrator] Shutting down")


app = FastAPI(
    title="GAUNTLET Orchestrator",
    description="BE1 — Attack orchestration, evaluation, and SSE streaming",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS: allow FE dashboard to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# SSE Endpoint
# ---------------------------------------------------------------------------
@app.get("/events")
async def sse_events():
    """Long-lived SSE connection. Replays history on connect, then streams."""

    async def event_generator() -> AsyncGenerator[dict, None]:
        async for data in event_bus.subscribe():
            yield {"data": data}

    return EventSourceResponse(event_generator())


# ---------------------------------------------------------------------------
# Attack Endpoints
# ---------------------------------------------------------------------------
class AttackRunRequest(BaseModel):
    attack_class: str | None = None  # "prompt_injection", "system_extract", "tool_hijack", or None for all
    max_attacks: int = 10


class SingleAttackRequest(BaseModel):
    scenario_id: str | None = None
    attack_class: str | None = None


@app.post("/attack/run")
async def run_attacks(req: AttackRunRequest):
    """
    Trigger a full attack run. Fires scenarios sequentially for demo reliability.
    Returns immediately; events stream via SSE.
    """
    scenarios = get_scenarios_for_class(req.attack_class)[:req.max_attacks]

    if not scenarios:
        return {"status": "error", "message": "No scenarios found for the given class"}

    # Run attacks in background so the HTTP response returns immediately
    async def _run():
        results = []
        for scenario in scenarios:
            try:
                event = await fire_attack(scenario, BE2_ATTACKER_URL)
                # Store attack for evaluator correlation
                store_attack(event["id"], event)
                results.append(event)
            except Exception as exc:
                print(f"[orchestrator] Attack failed: {exc}")
                # Retry once
                try:
                    event = await fire_attack(scenario, BE2_ATTACKER_URL)
                    store_attack(event["id"], event)
                    results.append(event)
                except Exception as retry_exc:
                    print(f"[orchestrator] Retry failed: {retry_exc}")

    asyncio.create_task(_run())

    return {
        "status": "started",
        "attack_count": len(scenarios),
        "attack_class": req.attack_class,
    }


@app.post("/attack/single")
async def run_single_attack(req: SingleAttackRequest):
    """Fire a single attack by scenario ID or class."""
    scenarios = load_scenarios()

    scenario = None
    if req.scenario_id:
        scenario = next((s for s in scenarios if s["id"] == req.scenario_id), None)
    elif req.attack_class:
        matching = [s for s in scenarios if s["class"] == req.attack_class]
        scenario = matching[0] if matching else None
    else:
        scenario = scenarios[0] if scenarios else None

    if not scenario:
        return {"status": "error", "message": "No matching scenario found"}

    # Ensure a fresh UUID for each run
    scenario = {**scenario, "id": str(uuid.uuid4())}

    async def _fire():
        try:
            event = await fire_attack(scenario, BE2_ATTACKER_URL)
            store_attack(event["id"], event)
        except Exception as exc:
            print(f"[orchestrator] Single attack failed: {exc}")

    asyncio.create_task(_fire())

    return {"status": "fired", "scenario_id": scenario["id"], "attack_class": scenario["class"]}


# ---------------------------------------------------------------------------
# Evaluator Inbound (from BE2)
# ---------------------------------------------------------------------------
class EvaluatorResponseRequest(BaseModel):
    attack_id: str
    response_text: str
    audio_url: str | None = None


@app.post("/evaluator/response")
async def receive_target_response(req: EvaluatorResponseRequest):
    """
    BE2 posts target responses here. Orchestrator evaluates and emits verdict.
    """
    async def _evaluate():
        try:
            verdict = await evaluate_response(
                attack_id=req.attack_id,
                response_text=req.response_text,
                audio_url=req.audio_url,
            )
            # Add to reporter accumulator
            add_verdict(verdict)

            # Check if we should generate a report
            # (auto-generate after receiving enough verdicts)
            from .reporter import get_verdicts
            verdicts = get_verdicts()
            total_attacks = len(event_bus.history)
            attack_count = sum(1 for e in event_bus.history if e.get("type") == "attack.fired")

            if len(verdicts) >= attack_count and attack_count > 0:
                await generate_report()

        except Exception as exc:
            print(f"[orchestrator] Evaluation failed for {req.attack_id}: {exc}")

    asyncio.create_task(_evaluate())

    return {"status": "received", "attack_id": req.attack_id}


# ---------------------------------------------------------------------------
# Report Endpoint (manual trigger)
# ---------------------------------------------------------------------------
@app.post("/report/generate")
async def trigger_report():
    """Manually trigger report generation from accumulated verdicts."""
    report = await generate_report()
    return report


# ---------------------------------------------------------------------------
# State Management
# ---------------------------------------------------------------------------
@app.post("/reset")
async def reset_state():
    """Reset all state for a fresh demo run."""
    event_bus.reset()
    reset_verdicts()
    return {"status": "reset"}


@app.post("/scenarios/reload")
async def reload_scenarios_endpoint():
    """Force-reload scenarios from disk (after Veris JSON update)."""
    scenarios = reload_scenarios()
    return {"status": "reloaded", "count": len(scenarios)}


# ---------------------------------------------------------------------------
# Utility
# ---------------------------------------------------------------------------
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "orchestrator",
        "scenarios_loaded": len(load_scenarios()),
    }


@app.get("/scenarios")
async def list_scenarios(attack_class: str | None = Query(None)):
    """List available attack scenarios."""
    scenarios = get_scenarios_for_class(attack_class)
    return {"scenarios": scenarios, "count": len(scenarios)}
