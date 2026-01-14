import { v4 as uuidv4 } from "uuid";
import { queryCollection, storeDocument } from "./client.js";

const COLLECTION = "emergences";
const localEmergences = [];

export async function storeEmergence({ task, solution, agents }) {
  const record = {
    id: uuidv4(),
    task,
    solution,
    agents,
    createdAt: new Date().toISOString(),
  };

  try {
    await storeDocument(COLLECTION, record);
  } catch (err) {
    console.error("[rag:store] failed, caching locally", err.message);
    localEmergences.push(record);
  }
  return record;
}

function keywordScore(text, query) {
  const normalize = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/gi, " ")
      .split(/\s+/)
      .filter(Boolean);

  const textTokens = new Set(normalize(text));
  const queryTokens = normalize(query);
  return queryTokens.reduce(
    (score, token) => (textTokens.has(token) ? score + 1 : score),
    0
  );
}

export async function querySimilar(task, limit = 3) {
  const response = await queryCollection(COLLECTION, { query: task, limit });
  if (response?.results && !response.mock) {
    return response.results;
  }

  if (localEmergences.length === 0) return [];
  const ranked = localEmergences
    .map((item) => ({
      item,
      score: keywordScore(item.task, task),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.item);
  return ranked;
}

export default {
  storeEmergence,
  querySimilar,
};
