export default function SynthesisView({ synthesis, agents, task, ready = false }) {
  const safeAgents = Array.isArray(agents) ? agents : [];
  const headline =
    (ready && synthesis) ||
    [
      "Synthesizing…",
      "Summary: pending",
      "Key Insights: pending",
      "Proposed Approach: pending",
      "Risks: pending",
      "Next Steps: pending",
    ].join("\n");

  return (
    <div className="min-h-screen p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-cyber-purple">
            Final Output
          </div>
          <h2 className="text-2xl font-bold text-white">Genesis Synthesis</h2>
          <div className="text-slate-400 mt-1">{task}</div>
        </div>
        <span className="tag">{agents.length} agents contributed</span>
      </div>

      <div className="panel p-6 grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-3">
          <div className="text-sm uppercase tracking-[0.2em] text-cyber-blue">
            {ready ? "Cohesive Plan" : "Synthesizing..."}
          </div>
          <div className="text-lg leading-relaxed text-slate-100 whitespace-pre-wrap">
            {headline}
          </div>
        </div>
        <div className="col-span-1">
          <div className="text-sm uppercase tracking-[0.2em] text-cyber-blue mb-2">
            Contributors
          </div>
          <div className="space-y-2 max-h-[60vh] overflow-auto scroll-thin">
            {safeAgents.length === 0 && (
              <div className="text-slate-400 text-sm">No agents recorded yet.</div>
            )}
            {safeAgents.map((agent) => (
              <div
                key={agent.id}
                className="flex items-center justify-between rounded-lg bg-[rgba(255,255,255,0.04)] border border-slate-800 p-3"
              >
                <div>
                  <div className="text-xs uppercase text-slate-400">{agent.role}</div>
                  <div className="text-sm text-white">
                    {agent.model || "model-auto"}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {agent.id?.replace(/-demo$/, "")}
                  </div>
                </div>
                <span className="tag">{agent.state}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
