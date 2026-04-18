# SSE Event Contract — BE1 → FE

> **Owner:** BE1 (Orchestrator)
> **Consumer:** FE (Dashboard)
> **Endpoint:** `GET /events` (long-lived SSE connection)

---

## Connection

```
GET http://localhost:8000/events
Accept: text/event-stream
```

The server sends newline-delimited SSE events. Each `data:` line is a JSON object with a `type` field.

---

## Event Types

### `attack.fired`

Emitted when the orchestrator sends an attack to the target.

```json
{
  "type": "attack.fired",
  "id": "uuid",
  "persona": "Anxious customer",
  "text": "The generated attack text...",
  "attack_class": "prompt_injection",
  "audio_url": null
}
```

| Field | Type | Description |
|---|---|---|
| `type` | `string` | Always `"attack.fired"` |
| `id` | `string` | UUID for this attack, used to correlate verdicts |
| `persona` | `string` | Veris persona name (e.g. "Anxious customer") |
| `text` | `string` | The full attack text sent to the target |
| `attack_class` | `string` | One of: `prompt_injection`, `system_extract`, `tool_hijack` |
| `audio_url` | `string \| null` | URL to TTS audio clip if available, else null |

---

### `verdict.ready`

Emitted when the evaluator has classified the target's response.

```json
{
  "type": "verdict.ready",
  "attack_id": "uuid",
  "exploited": true,
  "class": "prompt_injection",
  "evidence": "Target revealed: API_KEY=sk-acme-internal-7f3d9e1a"
}
```

| Field | Type | Description |
|---|---|---|
| `type` | `string` | Always `"verdict.ready"` |
| `attack_id` | `string` | Matches the `id` from the originating `attack.fired` |
| `exploited` | `boolean` | `true` if the attack succeeded |
| `class` | `string` | Attack classification |
| `evidence` | `string` | Short description of what was leaked/exploited |

---

### `report.ready`

Emitted when all attacks in a run have been evaluated.

```json
{
  "type": "report.ready",
  "score": 7.4,
  "vulnerabilities": 4,
  "top_classes": ["prompt_injection", "system_extract", "tool_hijack"]
}
```

| Field | Type | Description |
|---|---|---|
| `type` | `string` | Always `"report.ready"` |
| `score` | `number` | Risk score 0–10 (higher = more vulnerable) |
| `vulnerabilities` | `integer` | Count of successful exploits |
| `top_classes` | `string[]` | Attack classes that succeeded |

---

## Notes

- FE should reconnect on drop (EventSource does this automatically).
- Events are ordered chronologically. Multiple `attack.fired` events may arrive before their `verdict.ready` counterparts.
- `report.ready` is always the last event in a run.
- All timestamps are server-side; FE should use arrival order for display.
