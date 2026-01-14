import { roleColor } from "../mockData.js";

export default function AgentCard({ agent, onClose }) {
  if (!agent) return null;
  const color = roleColor(agent.role);

  return (
    <div className="panel absolute right-4 top-4 w-72 p-4 z-20">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ background: color, boxShadow: `0 0 12px ${color}` }}
          />
          <div>
            <div className="text-sm uppercase tracking-[0.14em] text-cyber-blue">
              {agent.role}
            </div>
            <div className="text-lg font-semibold">{agent.id}</div>
          </div>
        </div>
        <button
          className="text-cyber-blue hover:text-cyber-purple text-sm"
          onClick={onClose}
        >
          Close
        </button>
      </div>
      <div className="text-xs uppercase text-slate-300 mb-3">
        State: <span className="tag">{agent.state}</span>
      </div>
      <div className="text-sm leading-relaxed text-slate-200">
        Parent: {agent.parentId || "None"}
      </div>
      <div className="text-sm leading-relaxed text-slate-200">
        Depth: {agent.depth || "n/a"}
      </div>
      <div className="mt-3 text-sm text-slate-300">
        Activity load: {Math.round((agent.load || 0) * 100)}%
      </div>
    </div>
  );
}
