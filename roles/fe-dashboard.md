# FE — Dashboard · Your Plan

> **You own the show.** Every SSE event from BE1 becomes a visual moment on stage. The red strike when a jailbreak is caught, the score delta when CaMeL is applied, the audio clip pinned to the transcript — these are the moments judges will remember. The backend could be flawless, but if the dashboard is ugly or laggy, we lose. Stay on this file.

**Root plan:** [`../plan.md`](../plan.md) — source of truth for demo script, shared contracts, directory layout.

---

## Your demo moments

- **T+0:08** — Personas stream into Attack Feed (left panel)
- **T+0:18** — Attack text appears in Transcript (center), audio indicator active
- **T+0:30** — You.com citation slides in next to attack
- **T+0:45** — **Red strike animation** on exploited claim, verdict badge flips red
- **T+1:00** — Risk Report (right) shows score + vulnerabilities
- **T+1:15** — "Apply CaMeL Fix" button pulses; user clicks; CaMeL slide flashes
- **T+1:30** — Re-run, green pass animation

---

## What you own

- Next.js app in `web/`
- Three-panel layout (Attack Feed · Transcript · Risk Report)
- SSE consumer hook
- Audio clip player
- "Apply CaMeL Fix" button → calls BE2's `POST /target/mode`
- Red strike + score delta animations
- You.com citation rendering
- All 4 sponsor logos in footer

---

## Pre-flight

- [ ] Next.js project scaffolded locally, `npm run dev` runs
- [ ] Tailwind CSS configured
- [ ] Know BE1's SSE endpoint URL (default `http://localhost:8000/events`)
- [ ] Know BE2's mode toggle URL (default `http://localhost:8001/target/mode`)
- [ ] `fe/` branch ready

---

## Hour-by-Hour

### Hour 0 (0:00–0:30)

- **0:00–0:10** — team standup
- **0:10–0:30** — scaffold:
  ```
  web/
  ├── app/
  │   ├── page.tsx              # main dashboard
  │   └── layout.tsx
  ├── components/
  │   ├── AttackFeed.tsx        # left panel
  │   ├── Transcript.tsx        # center panel
  │   ├── RiskReport.tsx        # right panel
  │   ├── ApplyCaMeLButton.tsx
  │   └── SponsorFooter.tsx     # 4 logos
  ├── hooks/
  │   └── useSSE.ts             # EventSource wrapper
  └── lib/
      └── citations.ts          # loads exploit-citations.json
  ```
- Three-panel grid with Tailwind:
  ```tsx
  <main className="grid grid-cols-3 gap-4 h-screen p-4 bg-slate-900 text-white">
    <AttackFeed />
    <Transcript />
    <RiskReport />
  </main>
  ```
- SSE consumer stub:
  ```tsx
  // hooks/useSSE.ts
  export function useSSE(url: string) {
    const [events, setEvents] = useState<SSEEvent[]>([])
    useEffect(() => {
      const es = new EventSource(url)
      es.onmessage = (e) => setEvents(prev => [...prev, JSON.parse(e.data)])
      return () => es.close()
    }, [url])
    return events
  }
  ```
- **PR `fe/scaffold`** merged by 0:30

### Hour 1 (0:30–1:30)

- **0:30–0:50** — SSE consumer wired. At 0:20, BE1 committed `docs/sse-contract.md` — read it, match event type names exactly.
- **0:50–1:10** — route events into panels:
  ```tsx
  events.forEach(event => {
    if (event.type === 'attack.fired') AttackFeed.append(event)
    if (event.type === 'verdict.ready') Transcript.addVerdict(event)
    if (event.type === 'report.ready') RiskReport.update(event)
  })
  ```
- **1:10–1:20** — audio player:
  - If `attack.fired.audio_url` present, show Play icon
  - On `verdict.ready` with `exploited: true`, pin audio clip as "evidence"
- **1:20–1:30** — Apply CaMeL button:
  ```tsx
  async function applyCaMeL() {
    await fetch('http://localhost:8001/target/mode', {
      method: 'POST',
      body: JSON.stringify({ mode: 'camel' })
    })
    setShowCaMeLFlash(true)
    setTimeout(() => setShowCaMeLFlash(false), 2000)
  }
  ```
  Fullscreen flash component for the CaMeL architecture PNG (Vince commits to `assets/camel-diagram.png` by min 80).

**PR `fe/events-and-controls` merged by 1:20.**

### Hour 2 (1:30–2:30)

- **1:35** — dry run. List everything that looks off.
- **1:35–2:15** — polish the 3 must-show moments:
  - **Red strike animation**: CSS `@keyframes` on the attack text — strikethrough grows left-to-right over 800ms + red background pulse. Use Tailwind `transition-all duration-500` + custom keyframes.
  - **CaMeL flash**: fullscreen overlay, 2s, showing architecture diagram with caption "Frontier Agent Hackathon winner — now applied live"
  - **Score delta**: animated number tick from old score to new. Use `framer-motion` or a simple `useEffect` increment loop.
- **2:15–2:30** — wire You.com citations. Vince commits `data/exploit-citations.json` at min 75. On `attack.fired`, look up by `attack_class`, render as small card inside Transcript entry with source link.

### Hour 3 (2:30–3:00)

- **2:30–2:45** — fix top visual issue from run #2
- **2:45–2:55** — test on demo laptop at projector resolution (check: 1080p vs 4K)
- **2:55–3:00** — final rehearsal

---

## Handoffs

**You receive:**
- SSE contract from BE1 at min 20 → `docs/sse-contract.md`
- You.com citations JSON from Vince at min 75 → `data/exploit-citations.json`
- CaMeL diagram PNG from Vince at min 80 → `assets/camel-diagram.png`

**You send:**
- Mode toggle calls to BE2 at runtime
- "Looks wrong" list back to team after each dry run

---

## Sponsor Footer (required)

Bottom of every page. Four logos, in order:

```tsx
<SponsorFooter>
  <Logo name="Veris" label="Scenario generation" />
  <Logo name="Baseten" label="LLM + TTS inference" />
  <Logo name="VoiceRun" label="Voice orchestration" />
  <Logo name="You.com" label="Exploit research" />
</SponsorFooter>
```

If you can't find logo assets, plain text in a matching font is fine. **Do not ship without all four visible.**

---

## Definition of Done (minute 120)

- [ ] All three panels render real SSE events
- [ ] Red strike animation fires on exploited verdict
- [ ] Apply CaMeL button triggers BE2 mode flip + fullscreen flash
- [ ] Score delta animates on report update
- [ ] All 4 sponsor logos visible
- [ ] You.com citations appear next to attacks

---

## If You're Stuck

- **SSE flaky in browser** → fall back to polling (`setInterval` fetch every 500ms) — BE1 can add a `/events?since=ts` endpoint
- **Tailwind config hell** → use plain CSS, skip utilities, just get it on screen
- **Animations eating time** → drop all transitions, swap colors instantly. The content is what matters.
- **You.com JSON delayed** → hardcode 3 placeholder citations inline until it arrives

---

## Cut List

1. Animated score delta → show final number only
2. You.com citation card styling → show URL only
3. Fullscreen CaMeL flash → show inline in center panel
4. Audio pin-to-evidence UI → just play inline

**Never cut:** the red strike animation on exploited verdict. That's the visual anchor of the whole demo.