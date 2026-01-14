import dotenv from "dotenv";
import { MessageBus } from "../core/messageBus.js";
import { TaskDecomposer } from "../core/taskDecomposer.js";
import AgentSpawner from "../core/agentSpawner.js";
import Genesis from "../core/genesis.js";
import Synthesizer from "../core/synthesizer.js";
import StateManager from "./stateManager.js";

dotenv.config();

export async function runEmergence(task) {
  const messageBus = new MessageBus();
  const stateManager = new StateManager({ maxAgents: 10 });
  const taskDecomposer = new TaskDecomposer({ rag: null });
  const synthesizer = new Synthesizer();
  const agentSpawner = new AgentSpawner({
    messageBus,
    taskDecomposer,
    stateManager,
    maxAgents: 10,
  });

  const genesis = new Genesis({
    messageBus,
    taskDecomposer,
    agentSpawner,
    synthesizer,
    stateManager,
    maxWorkers: 5,
  });

  const result = await genesis.run(task);
  return { result, state: stateManager.listAgents() };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const task =
    process.argv.slice(2).join(" ") ||
    "Design a mobile app for mental health";

  console.log("Starting EMERGENCE for task:", task);
  runEmergence(task)
    .then(({ result, state }) => {
      console.log("\n=== Emergence Result ===");
      console.log(JSON.stringify(result, null, 2));
      console.log("\n=== Agent States ===");
      console.log(JSON.stringify(state, null, 2));
    })
    .catch((error) => {
      console.error("Emergence failed:", error);
      process.exit(1);
    });
}
