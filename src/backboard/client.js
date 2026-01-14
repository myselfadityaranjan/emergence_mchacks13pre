import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const BASE_URL =
  process.env.BACKBOARD_BASE_URL?.replace(/\/+$/, "") || "https://api.backboard.io";
const API_KEY = process.env.BACKBOARD_API_KEY || process.env.VITE_BACKBOARD_API_KEY;
const MOCK_MODE = process.env.BACKBOARD_MOCK === "1" || !API_KEY;
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

export async function post(path, data = {}) {
  if (MOCK_MODE) {
    throw new Error("Backboard mock mode is disabled for production. Provide BACKBOARD_API_KEY.");
  }
  return safeRequest("post", () => client.post(path, data));
}

export async function get(path, params = {}) {
  if (MOCK_MODE) {
    throw new Error("Backboard mock mode is disabled for production. Provide BACKBOARD_API_KEY.");
  }
  return safeRequest("get", () => client.get(path, { params }));
}

export async function invokeModel({ model, messages, tools = [], params = {} }) {
  if (MOCK_MODE) {
    throw new Error("Backboard mock mode is disabled for production. Provide BACKBOARD_API_KEY.");
  }

  return safeRequest("invokeModel", () =>
    client.post("/v1/messages", {
      model,
      messages,
      tools,
      params,
    })
  );
}

export async function storeDocument(collection, document) {
  if (MOCK_MODE) {
    throw new Error("Backboard mock mode is disabled for production. Provide BACKBOARD_API_KEY.");
  }
  return safeRequest("storeDocument", () =>
    client.post("/v1/rag/store", { collection, document })
  );
}

export async function queryCollection(collection, query) {
  if (MOCK_MODE) {
    throw new Error("Backboard mock mode is disabled for production. Provide BACKBOARD_API_KEY.");
  }
  return safeRequest("queryCollection", () =>
    client.post("/v1/rag/query", { collection, query })
  );
}

export async function searchWeb(query, options = {}) {
  if (MOCK_MODE) {
    throw new Error("Backboard mock mode is disabled for production. Provide BACKBOARD_API_KEY.");
  }

  return safeRequest("searchWeb", () =>
    client.get("/v1/search", { params: { q: query, ...options } })
  );
}

export default {
  get,
  post,
  invokeModel,
  storeDocument,
  queryCollection,
  searchWeb,
};
