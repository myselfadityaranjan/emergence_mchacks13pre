import { searchWeb } from "./client.js";
import { appendAgentLog } from "./memory.js";

export async function performSearch(agentId, query, options = {}) {
  const response = await searchWeb(query, options);
  const results = response?.results || [];

  await appendAgentLog(agentId, {
    type: "search",
    query,
    results: results.slice(0, 5),
  });

  return results;
}

export default {
  performSearch,
};
