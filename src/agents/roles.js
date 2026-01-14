export const ROLES = {
  GENESIS: "genesis",
  RESEARCHER: "researcher",
  ANALYST: "analyst",
  DESIGNER: "designer",
  ARCHITECT: "architect",
  COORDINATOR: "coordinator",
};

export const ROLE_DESCRIPTIONS = {
  [ROLES.GENESIS]: "Orchestrates the emergence, decomposes tasks, and synthesizes results.",
  [ROLES.RESEARCHER]: "Performs web research, gathers facts, and surfaces sources.",
  [ROLES.ANALYST]: "Analyzes information, compares options, and identifies risks.",
  [ROLES.DESIGNER]: "Creates UX/product experience plans and creative directions.",
  [ROLES.ARCHITECT]: "Designs technical approaches, system diagrams, and feasibility checks.",
  [ROLES.COORDINATOR]: "Keeps agents aligned, resolves conflicts, and tracks progress.",
};

export const DEFAULT_TEAM = [
  ROLES.RESEARCHER,
  ROLES.ANALYST,
  ROLES.ARCHITECT,
  ROLES.DESIGNER,
  ROLES.COORDINATOR,
];

export function describeRole(role) {
  return ROLE_DESCRIPTIONS[role] || "Specialized agent";
}

export default {
  ROLES,
  ROLE_DESCRIPTIONS,
  DEFAULT_TEAM,
  describeRole,
};
