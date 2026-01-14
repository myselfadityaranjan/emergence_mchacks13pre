const MODEL_MAP = {
  GENESIS: "gpt-4-turbo",
  CREATIVE: "claude-sonnet-3-5",
  SIMPLE: "llama-3-70b",
};

const ROLE_MODEL_HINT = {
  genesis: "GENESIS",
  researcher: "SIMPLE",
  analyst: "GENESIS",
  designer: "CREATIVE",
  architect: "GENESIS",
  coordinator: "CREATIVE",
};

export function selectModel({ role, taskType, preferredCategory }) {
  const category =
    preferredCategory ||
    ROLE_MODEL_HINT[role] ||
    (taskType === "planning" ? "GENESIS" : "SIMPLE");

  return {
    category,
    model: MODEL_MAP[category] || MODEL_MAP.SIMPLE,
    reason: `Using ${category} model for role ${role || "unknown"}.`,
  };
}

export function getRoutingConfig() {
  return {
    MODEL_MAP,
    ROLE_MODEL_HINT,
  };
}

export default {
  selectModel,
  getRoutingConfig,
};
