export class StateManager {
  constructor({ maxAgents = 10 } = {}) {
    this.maxAgents = maxAgents;
    this.agents = new Map();
    this.messages = [];
  }

  registerAgent(agent, depth = 1) {
    this.agents.set(agent.id, {
      id: agent.id,
      role: agent.role,
      parentId: agent.parentId,
      state: agent.state,
      depth,
    });
  }

  updateAgentState(id, state) {
    const record = this.agents.get(id) || { id };
    record.state = state;
    this.agents.set(id, record);
  }

  trackMessage(message) {
    this.messages.push(message);
  }

  listAgents() {
    return Array.from(this.agents.values());
  }

  listActive() {
    return this.listAgents().filter((a) => a.state !== "COMPLETE");
  }

  getAgent(id) {
    return this.agents.get(id) || null;
  }
}

export default StateManager;
