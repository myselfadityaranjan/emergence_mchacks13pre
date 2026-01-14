import { searchWeb } from "./client.js";
import { appendAgentLog } from "./memory.js";

export async function performSearch(agentId, query, options = {}) {
  try {
    const response = await searchWeb(query, options);
    const results = response?.results || [];

    await appendAgentLog(agentId, {
      type: "search",
      query,
      results: results.slice(0, 5),
    });

    return results;
  } catch (err) {
    console.error("[search] failed", err.message);
    await appendAgentLog(agentId, {
      type: "search:error",
      query,
      error: err.message,
    });
    return [];
  }
}

export default {
  performSearch,
};
