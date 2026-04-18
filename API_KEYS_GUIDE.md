# API Keys Quick Reference

## ✅ REQUIRED (Must Have)

### 1. Baseten API Key
**What it does:** Powers DeepSeek-V3.1 for attack generation and verdict evaluation  
**Where to get it:** https://app.baseten.co/settings/api-keys  
**Cost:** Free tier available  
**Add to `.env`:**
```bash
BASETEN_API_KEY=pgh2VLjc.your-actual-key-here
```

### 2. OpenAI API Key
**What it does:** Generates 10 realistic attack scenarios (Veris replacement)  
**Where to get it:** https://platform.openai.com/api-keys  
**Cost:** ~$0.10 for 10 scenarios (GPT-4o)  
**Add to `.env`:**
```bash
OPENAI_API_KEY=sk-proj-your-actual-key-here
```

---

## 🔧 OPTIONAL (Nice to Have)

### 3. You.com API Key
**What it does:** Fetches real OWASP/CVE exploit research citations  
**Where to get it:** https://api.you.com  
**Fallback:** High-quality hardcoded OWASP citations work without this  
**Add to `.env`:**
```bash
YOU_API_KEY=your-you-api-key-here
```

---

## ❌ NOT NEEDED

### Anthropic API Key
**Status:** Not used (OpenAI replaced this)  
**Original plan:** Was for Veris integration, now using OpenAI instead

### Baseten Orpheus Model ID
**Status:** Optional for TTS  
**Current:** Using deterministic text responses (no audio needed for demo)

---

## Setup Checklist

- [ ] Copy `.env.example` to `.env`
- [ ] Add `BASETEN_API_KEY` (required)
- [ ] Add `OPENAI_API_KEY` (required)
- [ ] Add `YOU_API_KEY` (optional, fallback works)
- [ ] Run `python scripts/generate_demo_data.py`
- [ ] Start services and test

---

## Cost Estimate

| Service | Usage | Cost |
|---------|-------|------|
| Baseten | ~50 DeepSeek calls | Free tier |
| OpenAI | 10 scenarios (GPT-4o) | ~$0.10 |
| You.com | 9 citation queries | Free tier |
| **Total** | **Full demo** | **~$0.10** |

---

## Troubleshooting

**"api_key client option must be set"**
→ Add the key to `.env` and restart services with `source .env`

**"Failed to generate scenarios"**
→ Check `OPENAI_API_KEY` is valid: `curl https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY"`

**"Citations empty"**
→ Normal if `YOU_API_KEY` not set — fallback OWASP citations will be used

**"Baseten rate limit"**
→ Free tier has limits — wait 60s or upgrade to paid tier
