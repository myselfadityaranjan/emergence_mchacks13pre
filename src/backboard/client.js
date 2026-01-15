import axios from "axios";
import FormData from "form-data";
import dotenv from "dotenv";

dotenv.config();

const BASE_URL = normalizeBaseUrl(process.env.BACKBOARD_BASE_URL);
const API_KEY = process.env.BACKBOARD_API_KEY || process.env.VITE_BACKBOARD_API_KEY;
const MOCK_MODE = process.env.BACKBOARD_MOCK === "1" || !API_KEY;

let cachedAssistantId = process.env.BACKBOARD_ASSISTANT_ID || null;
let cachedThreadId = null;

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

async function ensureAssistant(systemPrompt = "You are an EMERGENCE agent.") {
  ensureLive();
  if (cachedAssistantId) return cachedAssistantId;

  const payload = {
    name: "EMERGENCE Assistant",
    system_prompt: systemPrompt,
  };
  const data = await safeRequest("createAssistant", () =>
    client.post("/assistants", payload, { headers: { "Content-Type": "application/json" } })
  );
  cachedAssistantId = data.assistant_id;
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

  const content = messages
    .map((m) => `[${m.role}] ${m.content}`)
    .join("\n\n");

  const form = new FormData();
  form.append("content", content);
  form.append("stream", "false");
  form.append("send_to_llm", "true");
  form.append("memory", "Auto");
  if (model) {
    form.append("model_name", model);
  }

  const headers = {
    ...form.getHeaders(),
    "X-API-Key": API_KEY,
  };

  const data = await safeRequest("invokeModel", () =>
    client.post(`/threads/${threadId}/messages`, form, { headers })
  );

  return {
    output: data?.content || JSON.stringify(data),
    data,
  };
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
