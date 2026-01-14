import Agent from "./agent.js";
import { buildTools } from "../backboard/tools.js";

export class AgentSpawner {
  constructor({ messageBus, taskDecomposer, stateManager, maxAgents = 10 }) {
    this.messageBus = messageBus;
    this.taskDecomposer = taskDecomposer;
    this.stateManager = stateManager;
    this.maxAgents = maxAgents;
    this.agents = new Map();
  }

  async spawn({ role, task, parentId = null }) {
    if (this.agents.size >= this.maxAgents) {
      throw new Error(`Max agent limit (${this.maxAgents}) reached`);
    }

    let depth = 1;
    if (parentId && this.stateManager) {
      const parent = this.stateManager.getAgent(parentId);
      depth = (parent?.depth || 1) + 1;
    }
    if (depth > 2) {
      throw new Error("Spawn depth limit (2) exceeded");
    }

    const tools = buildTools({
      messageBus: this.messageBus,
      spawner: this,
      taskDecomposer: this.taskDecomposer,
    });

    const agent = new Agent({
      role,
      task,
      parentId,
      messageBus: this.messageBus,
      tools,
      stateManager: this.stateManager,
    });
    agent.depth = depth;

    this.agents.set(agent.id, agent);
    if (this.stateManager) {
      this.stateManager.registerAgent(agent, depth);
    }
    await agent.initialize();
    return agent;
  }

  listAgents() {
    return Array.from(this.agents.values());
  }
}

export default AgentSpawner;
