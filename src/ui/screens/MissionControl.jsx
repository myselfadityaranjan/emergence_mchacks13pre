import NetworkGraph from "../components/NetworkGraph.jsx";
import ActivityFeed from "../components/ActivityFeed.jsx";
import AgentCard from "../components/AgentCard.jsx";
import MetricsPanel from "../components/MetricsPanel.jsx";
import LoadingOverlay from "../components/LoadingOverlay.jsx";

export default function MissionControl({
  task,
  graphData,
  events,
  agents,
  selectedAgent,
  onSelectAgent,
  status,
  stats,
}) {
  const agentMap = new Map(agents.map((a) => [a.id, a]));
  const isLoadingGraph =
    status === "starting" || (status === "running" && (!graphData.nodes || graphData.nodes.length === 0));

  return (
    <div className="min-h-screen p-6 space-y-4 flex flex-col">
      <div className="panel p-4 flex items-center justify-between relative overflow-hidden shrink-0">
        <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_30%_20%,rgba(0,240,255,0.15),transparent_45%),radial-gradient(circle_at_70%_60%,rgba(176,38,255,0.12),transparent_40%)]" />
        <div className="relative">
          <div className="text-xs uppercase tracking-[0.3em] text-cyber-purple">Mission Control</div>
          <h2 className="text-2xl font-bold text-white">{task}</h2>
          <p className="text-xs text-slate-400 mt-1">
            Live delegation map + telemetry. Nodes show role and model; edges spawn as agents collaborate.
          </p>
        </div>
        <div className="relative flex items-center gap-2">
          <span className="tag">Status: {status}</span>
          <span className="tag">{graphData.nodes.length} Agents</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">
        <div className="col-span-8 relative h-full min-h-0">
          <div className="panel h-full relative overflow-hidden flex flex-col">
            <NetworkGraph
              nodes={graphData.nodes}
              links={graphData.links}
              onSelect={(id) => onSelectAgent?.(id)}
            />
            <AgentCard agent={agentMap.get(selectedAgent)} onClose={() => onSelectAgent?.(null)} />
            {isLoadingGraph && <LoadingOverlay text="Spawning agents..." />}
          </div>
        </div>
        <div className="col-span-4 h-full min-h-0 flex flex-col gap-3">
          <div className="panel flex-1 min-h-0 overflow-hidden">
            <ActivityFeed events={events} />
          </div>
          <div className="panel h-[38%] overflow-hidden">
            <MetricsPanel stats={stats} />
          </div>
        </div>
      </div>
    </div>
  );
}
