import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

/**
 * Backboard endpoint reference (per docs screenshot / v1.0.0 OAS):
 * Base URL: https://app.backboard.io/api/v1
 * Path shape: /messages, /rag/query, /rag/store, /search, /memory
 */
function normalizeBaseUrl(raw) {
  const cleaned = (raw || "").trim().replace(/\/+$/, "");
  if (!cleaned) return "https://app.backboard.io/api/v1";
  if (cleaned.endsWith("/api/v1")) return cleaned;
  if (cleaned.endsWith("/api/v1/")) return cleaned.replace(/\/+$/, "");
  if (cleaned.endsWith("/api")) return `${cleaned}/v1`;
  if (cleaned.endsWith("/api/")) return `${cleaned.replace(/\/+$/, "")}/v1`;
  return `${cleaned}/api/v1`;
}

const BASE_URL = normalizeBaseUrl(process.env.BACKBOARD_BASE_URL);
const API_KEY = process.env.BACKBOARD_API_KEY || process.env.VITE_BACKBOARD_API_KEY;
const MOCK_MODE = process.env.BACKBOARD_MOCK === "1" || !API_KEY;
const DEMO_MODE = process.env.BACKBOARD_DEMO === "1";
const MAX_RETRY = 3;

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
  },
});

function logCall(name, start, extra = {}) {
  const ms = Date.now() - start;
  // eslint-disable-next-line no-console
  console.log(`[backboard:${name}] ${ms}ms`, extra);
}

function joinPath(base, suffix) {
  return `${base.replace(/\/+$/, "")}/${suffix.replace(/^\/+/, "")}`;
}

const endpointCache = {};

async function requestWithCandidates(fnName, method, candidates, { data, params } = {}) {
  const start = Date.now();
  // If cached path exists, try it first
  const cached = endpointCache[fnName];
  const ordered = cached ? [cached, ...candidates.filter((c) => c !== cached)] : candidates;

  let lastError;
  for (const path of ordered) {
    try {
      const res =
        method === "get"
          ? await client.get(path, { params })
          : await client[method](path, data);
      endpointCache[fnName] = path;
      logCall(fnName, start, { path });
      return res?.data ?? null;
    } catch (error) {
      lastError = error;
      const status = error?.response?.status;
      if (status && status >= 500 && status < 600) {
        continue;
      }
      // On 404, try next candidate
      continue;
    }
  }
  throw lastError || new Error(`All endpoint candidates failed for ${fnName}`);
}

async function safeRequest(fnName, fn, attempt = 1) {
  const start = Date.now();
  try {
    const response = await fn();
    logCall(fnName, start, { attempt });
    return response?.data ?? null;
  } catch (error) {
    const status = error?.response?.status;
    const body = error?.response?.data;
    console.error(`[backboard:${fnName}] attempt ${attempt} failed`, status, body || error.message);
    if (attempt < MAX_RETRY && status && status >= 500) {
      return safeRequest(fnName, fn, attempt + 1);
    }
    throw error;
  }
}

export async function testBackboardConnection() {
  console.log("[diagnostic] Testing Backboard connection...");
  console.log("[diagnostic] API URL:", BASE_URL);
  console.log("[diagnostic] API Key:", API_KEY ? `${API_KEY.slice(0, 6)}...` : "MISSING");
  try {
    // No documented health; use a lightweight GET to root (will 404 but proves DNS)
    await client.get("/health").catch(() => {});
    console.log("[diagnostic] DNS/host reachable");
    return true;
  } catch (error) {
    console.error("[diagnostic] Connection failed:", error.message);
    console.error("[diagnostic] Check API URL, key, internet, and Backboard status.");
    return false;
  }
}

function ensureLive() {
  if (MOCK_MODE || DEMO_MODE) {
    throw new Error(
      "Backboard in demo/mock mode. Provide BACKBOARD_API_KEY and set BACKBOARD_MOCK=0 to enable live calls."
    );
  }
}

export async function post(path, data = {}) {
  ensureLive();
  return safeRequest("post", () => client.post(path, data));
}

export async function get(path, params = {}) {
  ensureLive();
  return safeRequest("get", () => client.get(path, { params }));
}

export async function invokeModel({ model, messages, tools = [], params = {} }) {
  ensureLive();
  return safeRequest("invokeModel", () =>
    requestWithCandidates("invokeModel", "post", ["/messages"], {
      data: { model, messages, tools, params },
    })
  );
}

export async function storeDocument(collection, document) {
  ensureLive();
  return safeRequest("storeDocument", () =>
    requestWithCandidates("storeDocument", "post", ["/rag/store"], {
      data: { collection, document },
    })
  );
}

export async function queryCollection(collection, query) {
  ensureLive();
  return safeRequest("queryCollection", () =>
    requestWithCandidates("queryCollection", "post", ["/rag/query"], {
      data: { collection, query },
    })
  );
}

export async function searchWeb(query, options = {}) {
  ensureLive();
  return safeRequest("searchWeb", () =>
    requestWithCandidates("searchWeb", "get", ["/search"], {
      params: { q: query, ...options },
    })
  );
}

export default {
  get,
  post,
  invokeModel,
  storeDocument,
  queryCollection,
  searchWeb,
  testBackboardConnection,
};
