import { ROLES } from "./roles.js";

export const ROLE_CAPABILITIES = {
  [ROLES.GENESIS]: ["plan", "decompose", "spawn", "synthesize", "route"],
  [ROLES.RESEARCHER]: ["search", "gather", "summarize", "message"],
  [ROLES.ANALYST]: ["analyze", "compare", "risks", "message"],
  [ROLES.DESIGNER]: ["ideate", "ux", "copy", "message"],
  [ROLES.ARCHITECT]: ["tech-plan", "evaluate", "constraints", "message"],
  [ROLES.COORDINATOR]: ["track", "clarify", "resolve", "message"],
};

export function getCapabilities(role) {
  return ROLE_CAPABILITIES[role] || [];
}

export default {
  ROLE_CAPABILITIES,
  getCapabilities,
};
