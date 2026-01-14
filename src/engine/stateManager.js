export class StateManager {
  constructor({ maxAgents = 10 } = {}) {
    this.maxAgents = maxAgents;
    this.agents = new Map();
    this.messages = [];
    this.events = [];
    this.links = [];
    this.status = "idle";
    this.task = "";
    this.synthesis = "";
  }

  registerAgent(agent, depth = 1) {
    const record = {
      id: agent.id,
      role: agent.role,
      parentId: agent.parentId,
      state: agent.state,
      depth,
    };
    this.agents.set(agent.id, record);
    if (agent.parentId) {
      this.links.push({ source: agent.parentId, target: agent.id, type: "spawn" });
    }
    this.addEvent({
      type: "spawn",
      text: `Spawned ${agent.role} (${agent.id})`,
      agentId: agent.id,
    });
  }

  updateAgentState(id, state) {
    const record = this.agents.get(id) || { id };
    record.state = state;
    this.agents.set(id, record);
    this.addEvent({
      type: "state",
      text: `${record.role || "Agent"} ${id} → ${state}`,
      agentId: id,
    });
  }

  trackMessage(message) {
    this.messages.push(message);
    this.addEvent({
      type: "message",
      text: `${message.from || "agent"} → ${message.to || "all"}: ${message.topic || "message"}`,
      agentId: message.to,
    });
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

  addEvent(event) {
    const entry = { id: `${event.type}-${Date.now()}-${Math.random()}`, ts: Date.now(), ...event };
    this.events.unshift(entry);
    if (this.events.length > 200) {
      this.events.length = 200;
    }
  }

  setStatus(status) {
    this.status = status;
  }

  setTask(task) {
    this.task = task;
  }

  setSynthesis(text) {
    this.synthesis = text;
  }

  snapshot() {
    return {
      status: this.status,
      task: this.task,
      agents: this.listAgents(),
      links: this.links,
      events: this.events,
      messages: this.messages.slice(-50),
      synthesis: this.synthesis,
    };
  }
}

export default StateManager;
