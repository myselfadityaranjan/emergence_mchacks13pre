import dotenv from "dotenv";
import { MessageBus } from "../src/core/messageBus.js";
import { TaskDecomposer } from "../src/core/taskDecomposer.js";
import AgentSpawner from "../src/core/agentSpawner.js";
import Genesis from "../src/core/genesis.js";
import Synthesizer from "../src/core/synthesizer.js";
import StateManager from "../src/engine/stateManager.js";

dotenv.config();

const task =
  process.argv.slice(2).join(" ") || "Design a mobile app for mental health";

async function runDemo() {
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
    maxWorkers: 8,
  });

  messageBus.onMessage((msg) => {
    console.log(
      `[MESSAGE] ${msg.from || "agent"} -> ${msg.to || "broadcast"} | ${
        msg.topic || ""
      }`
    );
  });

  console.log("=== EMERGENCE DEMO RUN ===");
  console.log("Task:", task);
  const summary = await genesis.run(task);

  console.log("\nSubtasks:");
  summary.subtasks.forEach((st, i) =>
    console.log(` ${i + 1}. (${st.role}) ${st.title || st.description}`)
  );

  console.log("\nAgent Results:");
  summary.results.forEach((r) =>
    console.log(
      ` - ${r.role} [${r.model}]: ${String(r.output).slice(0, 140)}${
        String(r.output).length > 140 ? "..." : ""
      }`
    )
  );

  console.log("\nSynthesis:\n", summary.synthesis);
  console.log("\nBackboard mock mode:", process.env.BACKBOARD_API_KEY ? "off" : "on");
}

runDemo().catch((err) => {
  console.error("Demo failed", err);
  process.exit(1);
});
