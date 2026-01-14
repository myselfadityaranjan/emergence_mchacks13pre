export function buildTools({ messageBus, spawner, taskDecomposer }) {
  return {
    async sendMessage({ from, to, topic, content }) {
      return messageBus.publish({ from, to, topic, content });
    },
    async spawnAgent(config) {
      return spawner.spawn(config);
    },
    async decomposeTask(task, context = {}) {
      return taskDecomposer.decompose(task, context);
    },
  };
}

export function toolSchemas() {
  return [
    {
      name: "sendMessage",
      description: "Send a message to another agent via the message bus",
      parameters: { from: "string", to: "string", topic: "string", content: "string" },
    },
    {
      name: "spawnAgent",
      description: "Spawn a specialized agent to handle a subtask",
      parameters: { role: "string", task: "string", parentId: "string" },
    },
    {
      name: "decomposeTask",
      description: "Break down a complex task into subtasks",
      parameters: { task: "string", context: "object" },
    },
  ];
}

export default {
  buildTools,
  toolSchemas,
};
