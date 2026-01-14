import { v4 as uuidv4 } from "uuid";
import { DEFAULT_TEAM, ROLES } from "../agents/roles.js";
import { TaskDecomposer } from "./taskDecomposer.js";
import { AgentSpawner } from "./agentSpawner.js";
import Synthesizer from "./synthesizer.js";
import { storeEmergence } from "../backboard/rag.js";
import { MessageBus } from "./messageBus.js";

export class Genesis {
  constructor({
    messageBus = new MessageBus(),
    taskDecomposer = new TaskDecomposer({ rag: null }),
    agentSpawner,
    synthesizer = new Synthesizer(),
    rag,
    stateManager,
    maxWorkers = 5,
  } = {}) {
    this.id = `genesis-${uuidv4().slice(0, 8)}`;
    this.messageBus = messageBus;
    this.taskDecomposer = taskDecomposer;
    this.agentSpawner = agentSpawner || new AgentSpawner({ messageBus, taskDecomposer, stateManager });
    this.synthesizer = synthesizer;
    this.rag = rag;
    this.stateManager = stateManager;
    this.maxWorkers = maxWorkers;
    this.outputs = [];

    this.messageBus.subscribe(this.id, (message) => this.handleMessage(message));
    if (this.stateManager) {
      this.messageBus.onMessage((msg) => this.stateManager.trackMessage(msg));
    }
  }

  async handleMessage(message) {
    // Genesis can observe worker messages; hook for future coordination.
    if (this.stateManager) {
      this.stateManager.trackMessage(message);
    }
  }

  async plan(task) {
    return this.taskDecomposer.decompose(task, {});
  }

  async spawnWorkers(subtasks) {
    const tasks = subtasks.slice(0, this.maxWorkers);
    const workers = [];
    for (const sub of tasks) {
      const role = sub.role || DEFAULT_TEAM[workers.length % DEFAULT_TEAM.length];
      const worker = await this.agentSpawner.spawn({
        role,
        task: sub.description || sub.title,
        parentId: this.id,
      });
      workers.push({ agent: worker, subtask: sub });
    }
    return workers;
  }

  async run(task) {
    if (this.stateManager) {
      this.stateManager.setStatus("running");
      this.stateManager.setTask(task);
    }

    const subtasks = await this.plan(task);
    const workers = await this.spawnWorkers(subtasks);

    const results = await Promise.all(
      workers.map(({ agent, subtask }) =>
        agent.work(subtask.description || subtask.title)
      )
    );

    const synthesis = await this.synthesizer.synthesize(
      task,
      results.map((r) => r)
    );

    const summary = {
      task,
      subtasks,
      results,
      synthesis,
    };

    if (this.rag) {
      await storeEmergence({
        task,
        solution: { summary: synthesis },
        agents: results.map((r) => ({
          id: r.agentId,
          role: r.role,
          model: r.model,
        })),
      });
    }

    if (this.stateManager) {
      this.stateManager.setSynthesis(synthesis);
      this.stateManager.setStatus("complete");
    }
    return summary;
  }
}

export default Genesis;
