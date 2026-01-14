import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ROLES } from "../roles.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadPrompt(filename) {
  const fullPath = path.join(__dirname, `${filename}.md`);
  try {
    return fs.readFileSync(fullPath, "utf8");
  } catch (error) {
    console.error(`Failed to load prompt ${filename}:`, error.message);
    return "";
  }
}

export const rolePrompts = {
  [ROLES.RESEARCHER]: loadPrompt("researcher"),
  [ROLES.ANALYST]: loadPrompt("analyst"),
  [ROLES.DESIGNER]: loadPrompt("designer"),
  [ROLES.ARCHITECT]: loadPrompt("architect"),
  [ROLES.COORDINATOR]: loadPrompt("coordinator"),
  [ROLES.GENESIS]:
    "You are Genesis, the orchestrator of the EMERGENCE collective. Coordinate agent work, plan, and synthesize.",
};

export function getPromptForRole(role) {
  return rolePrompts[role] || "";
}

export default {
  rolePrompts,
  getPromptForRole,
};
