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
        "Summary: ASML-focused finance tracker with live price feeds, position health, and risk alerts.",
        "Key Insights: Users want semiconductor-specific news, implied-vol indicators, and tax-lot clarity.",
        "Proposed Approach: Mobile-first dashboard with sparkline tiles, broker sync (optional), and offline watchlist cache.",
        "Risks: Data freshness, API rate limits, and over-alerting; mitigate with tiered polling + quiet hours.",
        "Next Steps: Wire charts, connect market data mock, ship alert rules (price bands, volume spikes), pilot with 10 users.",
      ].join("\n")
    : [
        "Summary: Calm, privacy-first mental health companion with daily check-ins, offline-first journaling, and guided CBT micro-sessions.",
        "Key Insights: Users crave trust (privacy), gentle nudges, crisis shortcuts, and community with safety filters.",
        "Proposed Approach: React Native app; encrypted local storage with optional sync; soothing gradients; 3-tap flows; adaptive journeys by mood.",
        "Risks: Privacy, engagement drop-off, and alert fatigue; mitigate with transparent data handling, streaks, and low-friction shortcuts.",
        "Next Steps: Wireframe key screens, finalize content scripts, run 10-user pilot, instrument telemetry + red-team privacy.",
      ].join("\n");

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
        researcher: "Market pulse: ASML uptrend; catalysts: lithography demand, EUV capacity; risks: export controls, cyclical capex.",
        analyst: "Signals: watch volume spikes + IV crush around earnings; alert on -3% intraday with news sentiment filter.",
        architect: "Stack: React Native + local cache; market data via websocket; rule engine for alerts; portfolio import via CSV/API.",
        designer: "UI: dark glass cards with cyan/green sparklines; watchlist chips; risk meter ring; alert composer wizard.",
      }
    : {
        researcher: "Trends: AI personalization, privacy-by-default, offline-first journaling. Competitors: Calm, Headspace, Wysa; gaps in community safety.",
        analyst: "Risks: privacy trust, drop-off after week 2, crisis routing; add transparent data copy, streaks, crisis shortcuts.",
        architect: "Stack: React Native, local SQLite w/ encryption, optional Firebase sync; services: auth, telemetry, crash reporting.",
        designer: "UX: neon-accent calm palette, glass panels, code-rain backgrounds; flows: 3-tap check-in, mood wheel, adaptive insights.",
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
