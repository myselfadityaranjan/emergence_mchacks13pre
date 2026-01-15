# EMERGENCE — Self-Organizing AI Collective (McHacks 13)

Cyberpunk-grade multi-agent engine + visualization. Genesis decomposes tasks, spawns specialists, routes through Backboard, and renders a live neural network graph.

## Quick Start

```bash
npm install
cp .env.example .env
# get Backboard API key at https://backboard.io/hackathons (code: MCHACKS26)
# paste into BACKBOARD_API_KEY (and VITE_BACKBOARD_API_KEY if you want UI-side access)
npm run dev   # runs API (port 4000) + Vite UI (port 5173)
```

Open http://localhost:5173 and hit **Initiate Emergence**. With no Backboard key, the API runs in mock mode but the UI still animates.

## Scripts
- `npm run dev` – concurrently start API (`:4000`) and UI (`:5173`)
- `npm run api` – API only (express + emergence engine)
- `npm run ui` – Vite dev server
- `npm run build:ui` / `npm run preview:ui` – build/preview UI
- `node scripts/demo.js "<task>"` – CLI demo of full run
- `node scripts/test-connection.js` – probe Backboard endpoints

## Environment
Copy `.env.example` to `.env` and fill:
- `BACKBOARD_BASE_URL` – Backboard base (per docs: `https://app.backboard.io/api`)
- `BACKBOARD_API_KEY` / `VITE_BACKBOARD_API_KEY` – from https://backboard.io/hackathons (use code **MCHACKS26**)
- `BACKBOARD_MOCK` – set `0` (required for live calls)
- `PORT` – API port (default 4000)
- `VITE_EMERGENCE_STATE_API` – UI polling endpoint (default `http://localhost:4000/api/state`)
- `VITE_EMERGENCE_RUN_API` – UI run endpoint (default `http://localhost:4000/api/run`)
- `VITE_POLL_MS` – UI poll interval in ms
(.env is already gitignored.)

Optional assets:
- `public/assets/sounds/agent-spawn.mp3`, `message-sent.mp3`, `task-complete.mp3` (drop in to add subtle sfx)

## Demo Tasks
Located in `examples/`:
- `simple-task.json` – Create a logo design brief (2–3 agents)
- `medium-task.json` – Design a mobile app for mental health (4–5 agents)
- `complex-task.json` – Launch a SaaS startup (7–8 agents)

## UI Notes
- Force-directed graph (d3-force) with neon nodes/edges and scanlines/particles.
- Activity feed shows spawns/messages/search/completions.
- Loading overlay during agent spin-up; glitching EMERGENCE title; background neural particles.
- Polls API every 800ms for real-time updates; debounces errors to fall back to mock if API is down.

## Backend Notes
- Express API at `/api/run` (start) and `/api/state` (live snapshot).
- StateManager captures agent states, links, and events for the UI.
- Uses Backboard wrappers; runs in mock mode without `BACKBOARD_API_KEY`.

## Performance
- Graph tuned for ~10 agents @ 60fps: collision + limited alpha decay.
- Memoized nodes/edges and lightweight burst animations.
- Poll interval configurable via `VITE_POLL_MS`.

## Screenshots (capture for demo)
- GenesisInput showing glitch title + cyber UI.
- EmergenceView with network graph and live activity feed.
- ControlRoom metrics panel.
- SynthesisView final output panel.

## Checklist
- [x] `npm install && npm run dev` works (API + UI)
- [x] Demo tasks runnable (examples/)
- [x] Backboard features mocked when key absent; routes ready when present
- [x] Visuals: neon/pulse/glitch + smooth transitions
- [x] No console errors in UI build (`npm run build:ui`)
