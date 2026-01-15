import axios from "axios";
import FormData from "form-data";
import dotenv from "dotenv";

dotenv.config();

const BASE_URL = normalizeBaseUrl(process.env.BACKBOARD_BASE_URL);
const API_KEY = process.env.BACKBOARD_API_KEY || process.env.VITE_BACKBOARD_API_KEY;
const MOCK_MODE = process.env.BACKBOARD_MOCK === "1" || !API_KEY;
const PREFERRED_MODEL = process.env.BACKBOARD_MODEL_NAME;

let cachedAssistantId = process.env.BACKBOARD_ASSISTANT_ID || null;
let cachedThreadId = null;
let modelCache = null;
let resolving = false;

function normalizeBaseUrl(raw) {
  const cleaned = (raw || "").trim().replace(/\/+$/, "");
  if (!cleaned) return "https://app.backboard.io/api";
  if (cleaned.endsWith("/api")) return cleaned;
  if (cleaned.endsWith("/api/")) return cleaned.replace(/\/+$/, "");
  return `${cleaned}/api`;
}

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    "X-API-Key": API_KEY || "",
  },
});

function ensureLive() {
  if (MOCK_MODE) {
    throw new Error("Backboard in mock mode: provide BACKBOARD_API_KEY and set BACKBOARD_MOCK=0.");
  }
}

function logCall(name, start, extra = {}) {
  const ms = Date.now() - start;
  // eslint-disable-next-line no-console
  console.log(`[backboard:${name}] ${ms}ms`, extra);
}

async function safeRequest(name, fn) {
  const start = Date.now();
  try {
    const res = await fn();
    logCall(name, start);
    return res.data;
  } catch (err) {
    const status = err?.response?.status;
    const body = err?.response?.data;
    console.error(`[backboard:${name}]`, status, body || err.message);
    throw err;
  }
}

export async function testBackboardConnection() {
  if (MOCK_MODE) {
    console.warn("[diagnostic] Mock mode; skipping live probe.");
    return false;
  }
  try {
    await client.get("/models");
    console.log("[diagnostic] Backboard host reachable");
    return true;
  } catch (err) {
    console.error("[diagnostic] Connection failed:", err.message);
    return false;
  }
}

async function loadModels() {
  if (resolving) return modelCache;
  resolving = true;
  if (modelCache) return modelCache;
  const data = await safeRequest("listModels", () => client.get("/models"));
  modelCache = data?.models || [];
  resolving = false;
  return modelCache;
}

const PRIORITY_MODELS = [
  "gpt-4.1-mini",
  "gpt-4.1-nano",
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4.1",
  "gpt-5-mini",
  "gpt-5-nano",
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "claude-3-7-sonnet-20250219",
  "grok-3-mini",
  "command-r7b-12-2024",
  "ai21/jamba-mini-1.7",
  "ai21/jamba-large-1.7",
  "amazon/nova-2-lite-v1",
  "amazon/nova-lite-v1",
];

async function resolveModelCandidates(requested) {
  const baseOrder = [
    requested,
    PREFERRED_MODEL,
    ...PRIORITY_MODELS,
  ].filter(Boolean);

  try {
    const models = await loadModels();
    const names = new Set(models.map((m) => m.name));
    const valid = baseOrder.filter((name) => names.has(name));
    if (valid.length) return valid;
    const llm = models.filter((m) => m.model_type === "llm").map((m) => m.name);
    if (llm.length) return llm;
  } catch (err) {
    console.warn("[backboard] model list fetch failed, using fallback order only", err.message);
  }
  return baseOrder.length ? baseOrder : ["gpt-4.1-mini"];
}

async function ensureAssistant(systemPrompt = "You are an EMERGENCE agent.") {
  ensureLive();
  if (!cachedAssistantId) {
    const payload = {
      name: "EMERGENCE Assistant",
      system_prompt: systemPrompt,
    };
    const data = await safeRequest("createAssistant", () =>
      client.post("/assistants", payload, { headers: { "Content-Type": "application/json" } })
    );
    cachedAssistantId = data.assistant_id;
  }
  return cachedAssistantId;
}

async function ensureThread(assistantId) {
  ensureLive();
  if (cachedThreadId) return cachedThreadId;
  const data = await safeRequest("createThread", () =>
    client.post(`/assistants/${assistantId}/threads`, {}, { headers: { "Content-Type": "application/json" } })
  );
  cachedThreadId = data.thread_id;
  return cachedThreadId;
}

export async function invokeModel({ model, messages }) {
  ensureLive();
  const assistantId = await ensureAssistant(messages?.[0]?.content || "EMERGENCE agent.");
  const threadId = await ensureThread(assistantId);
  const candidates = await resolveModelCandidates(model);

  const content = messages
    .map((m) => `[${m.role}] ${m.content}`)
    .join("\n\n");

  const buildForm = (candidate) => {
    const f = new FormData();
    f.append("content", content);
    f.append("stream", "false");
    f.append("send_to_llm", "true");
    f.append("memory", "Auto");
    if (candidate) f.append("model_name", candidate);
    return { form: f, headers: { ...f.getHeaders(), "X-API-Key": API_KEY } };
  };

  let lastError;
  for (const candidate of candidates) {
    try {
      const { form, headers } = buildForm(candidate);
      const data = await safeRequest("invokeModel", () =>
        client.post(`/threads/${threadId}/messages`, form, { headers })
      );
      return {
        output: data?.content || JSON.stringify(data),
        data,
        model: candidate,
      };
    } catch (err) {
      lastError = err;
      const code = err?.response?.data?.error?.code || err?.response?.data?.code;
      const status = err?.response?.status;
      if (status === 404 || code === "model_not_found") {
        console.warn(`[backboard] model not available: ${candidate}, trying next`);
        continue;
      }
      throw err;
    }
  }
  throw lastError || new Error("All model candidates failed");
}

export async function listModels() {
  ensureLive();
  return safeRequest("listModels", () => client.get("/models"));
}

export default {
  invokeModel,
  listModels,
  testBackboardConnection,
};
