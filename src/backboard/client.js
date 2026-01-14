import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const BASE_URL = process.env.BACKBOARD_BASE_URL || "https://api.backboard.io";
const API_KEY = process.env.BACKBOARD_API_KEY;
const MOCK_MODE = process.env.BACKBOARD_MOCK === "1" || !API_KEY;

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
    ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
  },
});

async function safeRequest(fnName, fn) {
  try {
    const response = await fn();
    return response?.data ?? null;
  } catch (error) {
    console.error(`[backboard:${fnName}]`, error?.response?.data || error.message);
    return null;
  }
}

export async function post(path, data = {}) {
  if (MOCK_MODE) {
    return { mock: true, path, data };
  }
  return safeRequest("post", () => client.post(path, data));
}

export async function get(path, params = {}) {
  if (MOCK_MODE) {
    return { mock: true, path, params };
  }
  return safeRequest("get", () => client.get(path, { params }));
}

export async function invokeModel({ model, messages, tools = [], params = {} }) {
  if (MOCK_MODE) {
    const content =
      messages?.map((m) => m.content).join(" ") ||
      "No prompt provided to Backboard mock model.";
    return {
      mock: true,
      model,
      output: `Mock(${model}): ${content}`.slice(0, 800),
    };
  }

  return safeRequest("invokeModel", () =>
    client.post("/v1/model", {
      model,
      messages,
      tools,
      params,
    })
  );
}

export async function storeDocument(collection, document) {
  if (MOCK_MODE) {
    return { mock: true, collection, document };
  }
  return safeRequest("storeDocument", () =>
    client.post("/v1/rag/store", { collection, document })
  );
}

export async function queryCollection(collection, query) {
  if (MOCK_MODE) {
    return { mock: true, collection, query };
  }
  return safeRequest("queryCollection", () =>
    client.post("/v1/rag/query", { collection, query })
  );
}

export async function searchWeb(query, options = {}) {
  if (MOCK_MODE) {
    return {
      mock: true,
      query,
      results: [
        { title: "Mock result", url: "https://example.com", snippet: query },
      ],
    };
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
