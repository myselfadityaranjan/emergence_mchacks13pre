import { post, get } from "./client.js";

const fallbackStore = new Map();

const stateKey = (agentId) => `agent:${agentId}:state`;
const logKey = (agentId) => `agent:${agentId}:log`;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

async function writeKey(key, value) {
  try {
    await post("/memory/set", { key, value });
  } catch (err) {
    try {
      await post("/memory/set", { key, value }); // retry same path once
    } catch (e2) {
      console.error("[memory:set] falling back to local store", e2.message);
      fallbackStore.set(key, clone(value));
    }
  }
  return value;
}

async function writeAgentMemory(agentId, memory) {
  try {
    await post("/memory", { agent_id: agentId, memory });
  } catch (err) {
    console.error("[memory:agent] falling back to key store", err.message);
    await writeKey(stateKey(agentId), memory);
  }
}

async function readKey(key, defaultValue = null) {
  try {
    const result = await get("/memory/get", { key });
    if (result?.value !== undefined) return result.value;
  } catch (err) {
    // ignore
  }
  return fallbackStore.get(key) ?? defaultValue;
}

export async function setAgentState(agentId, state) {
  await writeAgentMemory(agentId, state);
  return writeKey(stateKey(agentId), state);
}

export async function getAgentState(agentId) {
  return readKey(stateKey(agentId));
}

export async function appendAgentLog(agentId, entry) {
  const existing = (await readKey(logKey(agentId), [])) || [];
  const next = [...existing, { ...entry, ts: new Date().toISOString() }];
  await writeKey(logKey(agentId), next);
  return next;
}

export async function inheritParentMemory(agentId, parentId) {
  if (!parentId) return [];
  const parentLog = (await readKey(logKey(parentId), [])) || [];
  if (parentLog.length === 0) return [];

  await writeKey(logKey(agentId), parentLog.map((entry) => ({ ...entry })));
  return parentLog;
}

export async function getAgentLog(agentId) {
  return readKey(logKey(agentId), []);
}

export default {
  setAgentState,
  getAgentState,
  appendAgentLog,
  inheritParentMemory,
  getAgentLog,
};
