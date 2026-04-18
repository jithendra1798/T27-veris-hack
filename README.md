# GAUNTLET 🎯

**Voice Agent Red Team Platform**

AI-powered security testing for voice agents. Generate realistic attack scenarios, test vulnerabilities, and apply the CaMeL defense pattern — all in one click.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt
cd web && npm install && cd ..

# 2. Set API keys in .env
cp .env.example .env
# Edit .env and add BASETEN_API_KEY and OPENAI_API_KEY

# 3. Generate demo data (10 attack scenarios + citations)
python scripts/generate_demo_data.py

# 4. Start services
# Terminal 1: Orchestrator
source .env && python -m uvicorn services.orchestrator.main:app --port 8000 --reload

# Terminal 2: Voice Service
source .env && EVALUATOR_RESPONSE_URL=http://localhost:8000/evaluator/response \
  python -m uvicorn services.voice.api:app --port 8001 --reload

# Terminal 3: Dashboard
cd web && npm run dev

# 5. Open http://localhost:3000 and click an attack button!
```

---

## 🎬 Demo

**Live:** https://web-ruby-zeta-7b2hrtjjr4.vercel.app

1. Pick an attack class (System Extract, Prompt Injection, Tool Hijack)
2. Watch 10 AI-generated personas stream into the attack feed
3. See real-time verdicts with OWASP exploit citations
4. Click **"Apply CaMeL Fix"** to harden the target
5. Re-run attacks → score drops from 8.3 to 0.0 ✅

---

## 🏗️ Architecture

```
┌─────────────┐     SSE      ┌──────────────────┐
│  Dashboard  │◄─────────────┤  BE1 Orchestrator │
│  (Next.js)  │              │   (FastAPI)       │
└─────────────┘              └──────────────────┘
                                      │
                            ┌─────────┴─────────┐
                            │                   │
                      ┌─────▼─────┐      ┌─────▼─────┐
                      │  Attacker │      │ Evaluator │
                      │ (DeepSeek)│      │ (DeepSeek)│
                      └─────┬─────┘      └─────▲─────┘
                            │                   │
                            │ POST /internal/   │
                            │ target/respond    │
                            │                   │
                      ┌─────▼───────────────────┴─────┐
                      │   BE2 Voice Service           │
                      │   (vulnerable ↔ CaMeL mode)   │
                      └───────────────────────────────┘
```

---

## 🔑 Sponsor Integrations

- **Baseten** — DeepSeek-V3.1 for attack generation & verdict evaluation
- **Veris** — OpenAI GPT-4o for realistic scenario generation
- **You.com** — Exploit research citations (OWASP, CVE)
- **VoiceRun** — Voice agent orchestration & mode toggling

---

## 📚 Documentation

- **[API Keys Guide](API_KEYS_GUIDE.md)** — Where to get keys, costs, troubleshooting
- **[Competition Setup](COMPETITION_SETUP.md)** — Full demo script for judges
- **[SSE Contract](docs/sse-contract.md)** — Event schema for frontend integration

---

## 🧪 Testing

```bash
# Health check
curl http://localhost:8000/health
curl http://localhost:8001/health

# Run 5 attacks
curl -X POST http://localhost:8000/attack/run \
  -H "Content-Type: application/json" \
  -d '{"max_attacks": 5}'

# Watch SSE stream
curl -N http://localhost:8000/events

# Toggle CaMeL mode
curl -X POST http://localhost:8001/target/mode \
  -H "Content-Type: application/json" \
  -d '{"mode": "camel"}'
```

---

## 📊 Results

**Vulnerable Mode:**
- 3/3 attack classes exploited
- Score: **8.3/10** (high risk)

**CaMeL Mode:**
- 0/3 attacks succeed
- Score: **0.0/10** (secure)

**One-click fix. Instant security.**

---

## 🛠️ Tech Stack

- **Backend:** FastAPI, Python 3.11+
- **Frontend:** Next.js 16, React, TailwindCSS
- **LLM:** Baseten (DeepSeek-V3.1), OpenAI (GPT-4o)
- **Deployment:** Vercel (frontend), local (backends)

---

## 📝 License

MIT

---

**Built for the Baseten × VoiceRun Hackathon**
