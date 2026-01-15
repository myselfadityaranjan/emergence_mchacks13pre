import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MessageBus } from "../core/messageBus.js";
import { TaskDecomposer } from "../core/taskDecomposer.js";
import AgentSpawner from "../core/agentSpawner.js";
import Genesis from "../core/genesis.js";
import Synthesizer from "../core/synthesizer.js";
import StateManager from "../engine/stateManager.js";
import { testBackboardConnection } from "../backboard/client.js";

dotenv.config();

const PORT = process.env.PORT || 4000;
const USING_MOCK = !process.env.BACKBOARD_API_KEY || process.env.BACKBOARD_MOCK === "1";
const DEMO_MODE = process.env.BACKBOARD_DEMO === "1";
let CONNECTION_OK = false;

let messageBus;
let stateManager;
let taskDecomposer;
let synthesizer;
let agentSpawner;
let genesis;
let currentRun = null;

function bootEngine() {
  messageBus = new MessageBus();
  stateManager = new StateManager({ maxAgents: 10 });
  taskDecomposer = new TaskDecomposer({ rag: null });
  synthesizer = new Synthesizer();
  agentSpawner = new AgentSpawner({
    messageBus,
    taskDecomposer,
    stateManager,
    maxAgents: 10,
  });
  genesis = new Genesis({
    messageBus,
    taskDecomposer,
    agentSpawner,
    synthesizer,
    stateManager,
    maxWorkers: 8,
  });
}

bootEngine();

async function runDiagnostics() {
  console.log("[CONFIG] BASE_URL", process.env.BACKBOARD_BASE_URL || "https://app.backboard.io/api");
  console.log("[CONFIG] KEY", process.env.BACKBOARD_API_KEY ? "SET" : "MISSING");
  if (USING_MOCK) {
    console.warn(
      "[EMERGENCE] BACKBOARD_API_KEY missing or BACKBOARD_MOCK=1. Running in mock/demo mode."
    );
    CONNECTION_OK = false;
    return CONNECTION_OK;
  }
  const ok = await testBackboardConnection();
  if (!ok) {
    console.warn("[EMERGENCE] Backboard unreachable. Enabling demo mode.");
    CONNECTION_OK = false;
  } else {
    console.log("[EMERGENCE] Backboard reachable. Live calls enabled.");
    CONNECTION_OK = true;
  }
  return CONNECTION_OK;
}

runDiagnostics();

const app = express();
app.use(cors());
app.use(express.json());

function startDemoRun(task, state, scenario = "mental_health") {
  const IS_FINANCE = scenario === "finance";
  const DEMO_TASK = IS_FINANCE
    ? "Design a finance tracker for ASML stock"
    : task || "Design a mobile app for mental health";

  const genesisId = "genesis-demo";
  const workers = [
    { id: "researcher-demo", role: "researcher", parentId: genesisId, model: IS_FINANCE ? "gpt-4.1" : "gpt-4o" },
    { id: "analyst-demo", role: "analyst", parentId: genesisId, model: IS_FINANCE ? "gpt-4.1-mini" : "gpt-4.1-mini" },
    { id: "architect-demo", role: "architect", parentId: genesisId, model: IS_FINANCE ? "grok-3" : "gemini-2.5-flash" },
    { id: "designer-demo", role: "designer", parentId: genesisId, model: IS_FINANCE ? "gpt-4o-mini" : "grok-3" },
  ];

  const synthesisText = IS_FINANCE
    ? [
        "Summary: ASML-focused finance tracker delivering live price/volume, position health, semiconductor news sentiment, and proactive risk alerts for a high-conviction ticker. Prioritizes data transparency and explainable signals.",
        "Key Insights: Users want lithography/semiconductor-specific signals (export controls, EUV/DUV capacity, earnings IV swings) plus clean tax-lot visibility. Alert quality matters more than quantity; provenance and timestamps drive trust.",
        "Proposed Approach: Mobile-first glass dashboard; websocket price feed; portfolio import (CSV/API); alert engine with rule templates (price bands, volume/IV spikes, sentiment shifts); offline watchlist cache; sector sentiment ribbon; optional broker sync.",
        "Architecture: React Native client + encrypted local cache; data adapters for price/news; rule engine microservice; notification pipeline with rate limits/quiet hours; charts: sparklines, mini depth, risk meter ring per position; exportable audit log.",
        "Risks: Stale data and API throttling, noisy alerts, and low explainability. Mitigations: tiered polling with backoff, deduped alert batching, user-tunable thresholds, per-alert provenance (source + timestamp), and preview of sample alerts during setup.",
        "Next Steps: Wire charting primitives + alert composer wizard; integrate mock data feed; pilot with 10 ASML-focused users; stress-test rate limits; add compliance-friendly exports and alert quality feedback loop.",
      ].join("\n\n")
    : [
        "Summary: Calm, privacy-first mental health companion with daily check-ins, offline-first journaling, guided CBT micro-sessions, and adaptive nudges that respect user consent.",
        "Key Insights: Users need trust (clear data handling, no surprise sharing), gentle habit cues, crisis shortcuts, and a safe community layer with strong moderation. Offline-first matters for discretion and reliability.",
        "Proposed Approach: React Native app; encrypted local storage with optional sync; 3-tap flows for mood check-in, journal, and guided practice; adaptive journeys by mood/streak; optional peer circles with safety filters.",
        "Architecture: React Native + local encrypted SQLite; optional sync (Firebase or Supabase); content engine for CBT/DBT scripts; telemetry with privacy budget; feature flags for experiments; push pipeline with quiet hours.",
        "Risks: Privacy perception, engagement drop-off after week 2, alert fatigue, and crisis routing gaps. Mitigations: transparent data copy everywhere, streaks + low-friction shortcuts, capped notifications, crisis CTA always visible.",
        "Next Steps: Wire onboarding + mood wheel + journal; script 10 CBT micro-sessions; run 10-user pilot; instrument telemetry and privacy red-team; add A/B for notification cadence.",
      ].join("\n\n");

  const schedule = (ms, fn) => setTimeout(fn, ms);

  // Seed genesis and status.
  state.registerAgent({ id: genesisId, role: "genesis", parentId: null, state: "ACTIVE" }, 0);
  state.addEvent({ type: "state", text: `Genesis briefing: ${DEMO_TASK}` });

  // Spawn workers slowly.
  workers.forEach((w, idx) => {
    schedule(800 + idx * 900, () => {
      state.registerAgent({ ...w, state: "SPAWNED" }, 1);
      state.updateAgentState(w.id, "WORKING");
      state.addEvent({
        type: "message",
        text: `${w.role} dispatch → model ${w.model}`,
        agentId: w.id,
      });
    });
  });

  // Simulated messages/results.
  const snippets = IS_FINANCE
    ? {
        researcher:
          "Market pulse: ASML uptrend; catalysts: EUV/DUV demand, capacity expansion, AI-driven chips; risks: export controls, cyclic capex. News sentiment: neutral→bullish last 14d.",
        analyst:
          "Signals to track: volume/IV spikes around earnings; -3% intraday with negative sentiment; +5% breakout with high volume. Build alert templates and noise filters.",
        architect:
          "Stack: React Native + encrypted local cache; websocket price feed; rule engine microservice; broker import (CSV/API); notification pipeline with rate limits.",
        designer:
          "UI: dark glass, cyan/green sparklines, stacked tiles (price, IV, news), alert composer wizard, risk meter ring per position, timeline of alerts with provenance.",
      }
    : {
        researcher:
          "Trends: AI personalization, privacy-by-default, offline-first journaling. Competitors: Calm, Headspace, Wysa; gaps in safe community and crisis shortcuts.",
        analyst:
          "Risks: privacy trust, drop-off after week 2, alert fatigue, and weak crisis routing. Recommendations: transparent data copy, streaks, low-friction crisis CTA.",
        architect:
          "Stack: React Native, encrypted local SQLite, optional sync; content engine for CBT/DBT; telemetry with privacy budget; feature flags for experiments.",
        designer:
          "UX: neon-accent calm palette, glass panels, code-rain background; 3-tap check-in, mood wheel, adaptive insights; community with strong safety filters.",
      };

  workers.forEach((w, idx) => {
    schedule(3200 + idx * 900, () => {
      const msg = snippets[w.role] || `Findings for ${w.role}`;
      state.addEvent({
        type: "message",
        text: `${w.role} → genesis: ${msg}`,
        agentId: genesisId,
      });
    });
  });

  // Mark completions.
  workers.forEach((w, idx) => {
    schedule(5400 + idx * 700, () => {
      state.updateAgentState(w.id, "COMPLETE");
      state.addEvent({
        type: "complete",
        text: `${w.role} complete • model ${w.model}`,
        agentId: w.id,
      });
    });
  });

  // Synthesis.
  schedule(7600, () => {
    state.setSynthesis(synthesisText);
    state.setStatus("complete");
    state.addEvent({
      type: "complete",
      text: "Genesis synthesis ready",
      agentId: genesisId,
    });
  });

  // Keep promise alive until end.
  return new Promise((resolve) => setTimeout(resolve, 8500));
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, status: stateManager?.status || "idle" });
});

app.post("/api/run", async (req, res) => {
  const { task } = req.body || {};
  if (!task) {
    return res.status(400).json({ error: "Task is required" });
  }
  if (currentRun) {
    return res.status(409).json({ error: "Run already in progress" });
  }

  bootEngine();
  stateManager.setTask(task);

  if (DEMO_MODE || USING_MOCK || !CONNECTION_OK) {
    stateManager.setStatus("running");
    const scenario =
      DEMO_MODE && USING_MOCK ? "finance" : "mental_health";
    currentRun = startDemoRun(task, stateManager, scenario).finally(() => {
      currentRun = null;
    });
    res.json({ status: "running", task });
    return;
  }

  stateManager.setStatus("running");
  currentRun = genesis
    .run(task)
    .catch((error) => {
      console.error("Emergence run failed:", error);
      stateManager.setStatus(DEMO_MODE || !CONNECTION_OK ? "demo" : "error");
    })
    .finally(() => {
      currentRun = null;
    });

  res.json({ status: CONNECTION_OK ? "running" : "demo", task });
});

app.get("/api/state", (_req, res) => {
  if (!stateManager) return res.json({ status: "idle" });
  res.json(stateManager.snapshot());
});

app.listen(PORT, () => {
  console.log(`EMERGENCE API running on http://localhost:${PORT}`);
});
