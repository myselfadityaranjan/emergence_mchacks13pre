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

// Buckets so we can reorder by provider if a preferred model is set.
const OPENAI_MODELS = [
  "gpt-4.1-mini",
  "gpt-4.1-nano",
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4.1",
  "gpt-5",
  "gpt-5-chat-latest",
  "gpt-5-mini",
  "gpt-5-nano",
];

const GOOGLE_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.5-pro",
];

const XAI_MODELS = [
  "grok-3",
  "grok-3-mini",
  "grok-4-0709",
];

function bucketedPriority(preferred) {
  const provider = preferred?.startsWith("gemini-")
    ? "google"
    : preferred?.startsWith("grok-")
      ? "xai"
      : preferred?.startsWith("gpt-")
        ? "openai"
        : null;

  // Default order: OpenAI -> Google -> xAI.
  let order = [...OPENAI_MODELS, ...GOOGLE_MODELS, ...XAI_MODELS];

  if (provider === "google") {
    order = [...GOOGLE_MODELS, ...XAI_MODELS, ...OPENAI_MODELS];
  } else if (provider === "xai") {
    order = [...XAI_MODELS, ...GOOGLE_MODELS, ...OPENAI_MODELS];
  }

  return order;
}

function unique(list) {
  return Array.from(new Set(list.filter(Boolean)));
}

function isAllowedModel(name) {
  // Only allow OpenAI (gpt-), Google (gemini-), xAI (grok-)
  return /^(gpt-|gemini-|grok-)/.test(name);
}

async function resolveModelCandidates(requested) {
  const priorityOrder = bucketedPriority(requested || PREFERRED_MODEL);
  const basePriority = unique([requested, PREFERRED_MODEL, ...priorityOrder]).filter(isAllowedModel);
  let candidates = [...basePriority];

  try {
    const models = await loadModels();
    const available = models
      .filter((m) => m.model_type === "llm")
      .map((m) => m.name)
      .filter(isAllowedModel);
    const availableSet = new Set(available);

    const preferredAndAvailable = basePriority.filter((m) => availableSet.has(m));
    const availableRemainder = available.filter((m) => !preferredAndAvailable.includes(m));
    const preferredButNotListed = basePriority
      .filter((m) => !availableSet.has(m))
      .filter(isAllowedModel);

    candidates = unique([
      ...preferredAndAvailable,
      ...availableRemainder,
      ...preferredButNotListed,
    ]);
  } catch (err) {
    console.warn("[backboard] model list fetch failed, falling back to priority only:", err.message);
  }

  if (!candidates.length) {
    candidates = ["gpt-4.1-mini", "gpt-4o"];
  } else {
    candidates = unique(
      [...candidates, "gpt-4.1-mini", "gpt-4o"].filter(isAllowedModel)
    );
  }

  return candidates;
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
      if (status === 429 || code === "insufficient_quota") {
        console.warn(`[backboard] quota hit for ${candidate}, trying next provider/model`);
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
