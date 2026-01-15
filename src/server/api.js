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
