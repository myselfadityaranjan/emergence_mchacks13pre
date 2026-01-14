import { v4 as uuidv4 } from "uuid";
import { selectModel } from "../backboard/routing.js";
import { invokeModel } from "../backboard/client.js";
import {
  appendAgentLog,
  getAgentLog,
  inheritParentMemory,
  setAgentState,
} from "../backboard/memory.js";
import { performSearch } from "../backboard/search.js";
import { getPromptForRole } from "../agents/prompts/index.js";
import { getCapabilities } from "../agents/capabilities.js";

export const AGENT_STATES = {
  SPAWNED: "SPAWNED",
  INITIALIZING: "INITIALIZING",
  ACTIVE: "ACTIVE",
  WORKING: "WORKING",
  COMPLETE: "COMPLETE",
};

export class Agent {
  constructor({
    id = uuidv4(),
    role,
    task,
    parentId = null,
    messageBus,
    tools,
    stateManager,
  }) {
    this.id = id;
    this.role = role;
    this.task = task;
    this.parentId = parentId;
    this.messageBus = messageBus;
    this.tools = tools;
    this.stateManager = stateManager;
    this.capabilities = getCapabilities(role);
    this.state = AGENT_STATES.SPAWNED;
    this.unsubscribe = null;
    this.result = null;
  }

  async initialize() {
    await this.setState(AGENT_STATES.INITIALIZING);
    await inheritParentMemory(this.id, this.parentId);

    this.unsubscribe = this.messageBus.subscribe(this.id, (msg) =>
      this.handleMessage(msg)
    );

    await this.appendLog({
      type: "lifecycle",
      message: "Initialized",
      role: this.role,
      parentId: this.parentId,
    });
    await this.setState(AGENT_STATES.ACTIVE);
  }

  async setState(next) {
    this.state = next;
    await setAgentState(this.id, next);
    if (this.stateManager) {
      this.stateManager.updateAgentState(this.id, next);
    }
  }

  async appendLog(entry) {
    return appendAgentLog(this.id, entry);
  }

  async handleMessage(message) {
    await this.appendLog({ type: "message:received", message });
  }

  async work(task = this.task) {
    if (this.state === AGENT_STATES.SPAWNED) {
      await this.initialize();
    }

    await this.setState(AGENT_STATES.WORKING);
    this.task = task;

    const searchResults = this.capabilities.includes("search")
      ? await performSearch(this.id, task, { limit: 5 })
      : [];

    const response = await this.generateResponse(task, searchResults);
    await this.appendLog({ type: "result", response });
    await this.setState(AGENT_STATES.COMPLETE);

    if (this.parentId) {
      await this.messageBus.publish({
        from: this.id,
        to: this.parentId,
        topic: "task:complete",
        content: response,
      });
    }

    this.result = response;
    return response;
  }

  async generateResponse(task, searchResults = []) {
    const prompt = getPromptForRole(this.role);
    const log = await getAgentLog(this.id);
    const recentContext = log
      .slice(-3)
      .map((item) => `${item.type}: ${JSON.stringify(item.message || item)}`)
      .join("\n");

    const userPrompt = [
      `Task: ${task}`,
      searchResults.length
        ? `Search findings:\n${searchResults
            .slice(0, 3)
            .map(
              (r, idx) =>
                `${idx + 1}. ${r.title || r.url || "result"} - ${
                  r.snippet || ""
                }`
            )
            .join("\n")}`
        : "",
      recentContext ? `Recent context:\n${recentContext}` : "",
      "Provide a concise, structured answer. Return bullet points when helpful.",
    ]
      .filter(Boolean)
      .join("\n\n");

    const { model } = selectModel({
      role: this.role,
      taskType: "analysis",
    });

    const completion = await invokeModel({
      model,
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: userPrompt },
      ],
      tools: this.tools ? Object.keys(this.tools) : [],
    });

    const output =
      completion?.output ||
      completion?.data ||
      completion?.text ||
      JSON.stringify(completion);

    return {
      agentId: this.id,
      role: this.role,
      task,
      model,
      output,
      searchResults,
    };
  }

  async shutdown() {
    if (this.unsubscribe) this.unsubscribe();
    await this.appendLog({ type: "lifecycle", message: "Shutting down" });
  }
}

export default Agent;
