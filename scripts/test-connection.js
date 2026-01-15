import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

function normalizeBaseUrl(raw) {
  const cleaned = (raw || "").trim().replace(/\/+$/, "");
  if (!cleaned) return "https://app.backboard.io/api";
  if (cleaned.endsWith("/api")) return cleaned;
  if (cleaned.endsWith("/api/")) return cleaned.replace(/\/+$/, "");
  return `${cleaned}/api`;
}

const BASE_URL = normalizeBaseUrl(process.env.BACKBOARD_BASE_URL);
const API_KEY = process.env.BACKBOARD_API_KEY || process.env.VITE_BACKBOARD_API_KEY;

const candidates = [
  BASE_URL,
  "https://app.backboard.io/api",
  "https://app.backboard.io/api/v1",
  "https://backboard.io/api",
  "https://backboard.io/api/v1",
  "https://api.backboard.io",
  "https://api.backboard.io/v1",
];

async function probe(url) {
  const client = axios.create({
    baseURL: url,
    timeout: 5000,
    headers: API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {},
  });
  try {
    const res = await client.get("/health").catch(() => null);
    console.log(`[probe] ${url} reachable`, res?.status || "unknown");
    return true;
  } catch (err) {
    console.error(`[probe] ${url} failed`, err.message);
    return false;
  }
}

async function main() {
  console.log("[config] BASE_URL", BASE_URL);
  console.log("[config] KEY", API_KEY ? `${API_KEY.slice(0, 6)}...` : "MISSING");
  for (const url of candidates) {
    // eslint-disable-next-line no-await-in-loop
    await probe(url);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
