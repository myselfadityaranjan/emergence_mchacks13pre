import { v4 as uuidv4 } from "uuid";
import { invokeModel } from "../backboard/client.js";
import { getPromptForRole } from "../agents/prompts/index.js";
import { getCapabilities } from "../agents/capabilities.js";
import { demoAgentResult } from "../backboard/demo.js";

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
    this.unsubscribe = this.messageBus.subscribe(this.id, (msg) =>
      this.handleMessage(msg)
    );

    this.log = [];
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
    if (this.stateManager) {
      this.stateManager.updateAgentState(this.id, next);
    }
  }

  async appendLog(entry) {
    this.log = [...(this.log || []), { ...entry, ts: new Date().toISOString() }];
    return this.log;
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

    const response = await this.generateResponse(task, []);
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
    const log = this.log || [];
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

    const model = "gpt-4o";

    try {
      let completion = null;
      try {
        completion = await invokeModel({
          model,
          messages: [
            { role: "system", content: prompt },
            { role: "user", content: userPrompt },
          ],
          tools: this.tools ? Object.keys(this.tools) : [],
        });
      } catch (err) {
        await this.appendLog({ type: "error", message: err.message });
        throw err;
      }

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
    } catch (err) {
      // Demo fallback
      const demo = demoAgentResult(this.role, task);
      return {
        agentId: this.id,
        role: this.role,
        task,
        model: demo.model,
        output: demo.output,
        searchResults,
      };
    }
  }

  async shutdown() {
    if (this.unsubscribe) this.unsubscribe();
    await this.appendLog({ type: "lifecycle", message: "Shutting down" });
  }
}

export default Agent;
