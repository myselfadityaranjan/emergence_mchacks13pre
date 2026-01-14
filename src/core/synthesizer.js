import { selectModel } from "../backboard/routing.js";
import { invokeModel } from "../backboard/client.js";

export class Synthesizer {
  async synthesize(task, agentOutputs = []) {
    const { model } = selectModel({
      role: "genesis",
      taskType: "synthesis",
      preferredCategory: "GENESIS",
    });

    const prompt = [
      `Task: ${task}`,
      "Agent outputs:",
      agentOutputs
        .map(
          (o) =>
            `- ${o.role} (${o.model || "n/a"}): ${typeof o.output === "string" ? o.output : JSON.stringify(o.output)}`
        )
        .join("\n"),
      "Combine into a cohesive plan with: Summary, Key Insights, Proposed Approach, Risks, Next Steps.",
    ].join("\n\n");

    const completion = await invokeModel({
      model,
      messages: [
        { role: "system", content: "Synthesize multi-agent outputs into a single plan." },
        { role: "user", content: prompt },
      ],
    });

    return (
      completion?.output ||
      completion?.text ||
      completion?.data ||
      JSON.stringify(completion || {})
    );
  }
}

export default Synthesizer;
