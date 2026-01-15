import { selectModel } from "../backboard/routing.js";
import { invokeModel } from "../backboard/client.js";
import { querySimilar } from "../backboard/rag.js";
import { DEFAULT_TEAM } from "../agents/roles.js";
import { demoDecomposition } from "../backboard/demo.js";

export class TaskDecomposer {
  constructor({ rag }) {
    this.rag = rag;
  }

  async decompose(task, context = {}) {
    const similar = await querySimilar(task, 3);
    const { model } = selectModel({
      role: "genesis",
      taskType: "planning",
      preferredCategory: "GENESIS",
    });

    const prompt = [
      "You are Genesis planning subtasks for an emergence.",
      `Main task: ${task}`,
      similar.length
        ? `Similar past emergences:\n${similar
            .map(
              (hit, idx) =>
                `${idx + 1}. ${hit.task} -> ${hit.solution?.summary || "n/a"}`
            )
            .join("\n")}`
        : "No similar past emergences found.",
      `Available roles: ${DEFAULT_TEAM.join(", ")}`,
      "Return 3-5 concise subtasks as JSON array: [{\"title\",\"role\",\"description\"}].",
      "Prefer diversity in roles and avoid redundant subtasks.",
    ].join("\n\n");

    try {
      const completion = await invokeModel({
        model,
        messages: [
          { role: "system", content: "Plan subtasks for the agent collective." },
          { role: "user", content: prompt },
        ],
      });

      const parsed = this.parseCompletion(completion);
      if (parsed.length > 0) return parsed;
    } catch (err) {
      console.error("[decompose] falling back to demo/fallback", err.message);
    }

    return demoDecomposition(task) || this.fallback(task);
  }

  parseCompletion(completion) {
    if (completion?.mock) return [];
    const text =
      completion?.output ||
      completion?.data ||
      completion?.text ||
      JSON.stringify(completion || {});

    try {
      const jsonStart = text.indexOf("[");
      const jsonEnd = text.lastIndexOf("]");
      if (jsonStart >= 0 && jsonEnd >= jsonStart) {
        const raw = text.slice(jsonStart, jsonEnd + 1);
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (error) {
      console.warn("Failed to parse decomposition output, using fallback.", error);
    }
    return [];
  }

  fallback(task) {
    // Simple default decomposition spanning the core roles.
    return [
      {
        title: "Background research",
        role: "researcher",
        description: `Research context, benchmarks, and user needs for: ${task}`,
      },
      {
        title: "Insight analysis",
        role: "analyst",
        description: `Analyze research findings and identify implications for: ${task}`,
      },
      {
        title: "Technical approach",
        role: "architect",
        description: `Propose architecture and feasibility plan for: ${task}`,
      },
      {
        title: "Experience design",
        role: "designer",
        description: `Outline UX and content direction for: ${task}`,
      },
      {
        title: "Coordination",
        role: "coordinator",
        description: `Summarize alignment, dependencies, and next steps for: ${task}`,
      },
    ];
  }
}

export default TaskDecomposer;
