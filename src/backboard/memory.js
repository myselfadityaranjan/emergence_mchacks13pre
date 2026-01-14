import { post, get } from "./client.js";

const fallbackStore = new Map();

const stateKey = (agentId) => `agent:${agentId}:state`;
const logKey = (agentId) => `agent:${agentId}:log`;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

async function writeKey(key, value) {
  const result = await post("/v1/memory/set", { key, value });
  if (!result || result.mock) {
    fallbackStore.set(key, clone(value));
  }
  return value;
}

async function readKey(key, defaultValue = null) {
  const result = await get("/v1/memory/get", { key });
  if (!result || result.mock) {
    return fallbackStore.get(key) ?? defaultValue;
  }
  return result?.value ?? defaultValue;
}

export async function setAgentState(agentId, state) {
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

  // Shallow clone so downstream agents can build on inherited traces.
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
