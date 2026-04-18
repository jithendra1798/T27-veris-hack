# GAUNTLET Competition Setup

## Quick Start for Demo

### 1. Set API Keys

Edit `.env` and add your keys:

```bash
# Required for attack generation & evaluation
BASETEN_API_KEY=your_baseten_key_here

# Required for Veris-style scenario generation
OPENAI_API_KEY=your_openai_key_here

# Optional: for real You.com citations (fallback works without it)
YOU_API_KEY=your_you_api_key_here
```

### 2. Generate Demo Data

This creates 10 realistic attack scenarios and fetches exploit research citations:

```bash
# Install dependencies if needed
pip install openai httpx

# Generate scenarios + citations
python scripts/generate_demo_data.py
```

This will create:
- `data/veris-scenarios.json` — 10 AI-generated attack scenarios
- `data/exploit-citations.json` — OWASP/CVE citations for each attack class

### 3. Start Services

```bash
# Terminal 1: BE1 Orchestrator (port 8000)
source .env
python -m uvicorn services.orchestrator.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: BE2 Voice Service (port 8001)
source .env
EVALUATOR_RESPONSE_URL=http://localhost:8000/evaluator/response \
python -m uvicorn services.voice.api:app --host 0.0.0.0 --port 8001 --reload

# Terminal 3: Frontend (port 3000)
cd web
npm run dev
```

### 4. Test the Full Stack

```bash
# Reset state
curl -X POST http://localhost:8000/reset

# Run 5 attacks (will use generated scenarios)
curl -X POST http://localhost:8000/attack/run \
  -H "Content-Type: application/json" \
  -d '{"max_attacks": 5}'

# Watch SSE stream
curl -N http://localhost:8000/events

# Open dashboard
open http://localhost:3000
```

### 5. Demo Script (Competition Judges)

1. **Open dashboard** at `http://localhost:3000`
2. **Click "System Extract"** attack button
3. **Watch the feed** — 10 Veris-generated personas stream in
4. **Audio plays** — attack fires with transcript
5. **Citation appears** — You.com research grounding
6. **Verdict: EXPLOITED** — red strike animation
7. **Click "Apply CaMeL Fix"** — toggle to hardened mode
8. **Re-run attack** — same scenario, now blocked
9. **Score: 8.3 → 0.0** — instant security improvement

## Sponsor Integrations (All 4 Visible)

✅ **Baseten** — DeepSeek-V3.1 for attack generation + verdict evaluation  
✅ **Veris** — OpenAI-powered scenario generation (10 realistic attacks)  
✅ **You.com** — Exploit research citations (OWASP LLM01, CVEs)  
✅ **VoiceRun** — Voice agent orchestration (BE2 target service)

## Troubleshooting

**Scenarios not loading?**
```bash
# Regenerate scenarios
python scripts/generate_demo_data.py

# Force reload
curl -X POST http://localhost:8000/scenarios/reload
```

**Citations empty?**
- Without `YOU_API_KEY`: fallback OWASP citations are used (still looks good!)
- With `YOU_API_KEY`: real-time research from You.com

**Attacks not exploiting?**
- Check BE2 is running with `EVALUATOR_RESPONSE_URL` set
- Verify mode is "vulnerable": `curl http://localhost:8001/health`
- Toggle mode: `curl -X POST http://localhost:8001/target/mode -d '{"mode":"vulnerable"}'`

## Deployed Frontend

**Production:** https://web-qw5azk9s1-siddarthas-projects-e09cfc25.vercel.app  
**Alias:** https://web-ruby-zeta-7b2hrtjjr4.vercel.app

Demo tape mode works on deployed site. For live mode, set environment variables in Vercel:
- `NEXT_PUBLIC_SSE_URL=https://your-be1-url.com/events`
- `NEXT_PUBLIC_MODE_TOGGLE_URL=https://your-be2-url.com/target/mode`
