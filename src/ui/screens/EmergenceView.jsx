import NetworkGraph from "../components/NetworkGraph.jsx";
import ActivityFeed from "../components/ActivityFeed.jsx";
import AgentCard from "../components/AgentCard.jsx";
import LoadingOverlay from "../components/LoadingOverlay.jsx";

export default function EmergenceView({
  task,
  graphData,
  events,
  agents,
  selectedAgent,
  onSelectAgent,
  status,
}) {
  const agentMap = new Map(agents.map((a) => [a.id, a]));
  const isLoadingGraph =
    status === "starting" || (status === "running" && (!graphData.nodes || graphData.nodes.length === 0));

  return (
    <div className="min-h-screen p-6 space-y-4">
      <div className="panel p-4 flex items-center justify-between relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_30%_20%,rgba(0,240,255,0.18),transparent_40%),radial-gradient(circle_at_70%_60%,rgba(176,38,255,0.16),transparent_35%)]" />
        <div className="relative">
          <div className="text-xs uppercase tracking-[0.3em] text-cyber-purple">Emergence</div>
          <h2 className="text-2xl font-bold text-white">{task}</h2>
          <p className="text-xs text-slate-400 mt-1">
            Delegation map visualized in slow-motion — watch roles branch and converge.
          </p>
        </div>
        <div className="relative flex items-center gap-2">
          <span className="tag">Cinematic Mode</span>
          <span className="tag">{graphData.nodes.length} Agents</span>
          <span className="tag">{status}</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 h-[75vh]">
        <div className="col-span-8 relative space-y-3">
          <div className="panel h-full relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none mix-blend-screen opacity-50 bg-[radial-gradient(circle_at_center,rgba(57,255,20,0.08),transparent_55%)]" />
            <NetworkGraph
              nodes={graphData.nodes}
              links={graphData.links}
              onSelect={(id) => onSelectAgent?.(id)}
            />
            <AgentCard agent={agentMap.get(selectedAgent)} onClose={() => onSelectAgent?.(null)} />
            {isLoadingGraph && <LoadingOverlay text="Spawning agents..." />}
          </div>
          <div className="panel p-3 grid grid-cols-3 gap-3 text-xs text-slate-300">
            <div>
              <div className="text-slate-200 font-semibold">Phase</div>
              <div className="text-cyber-blue">Delegation + Mind-map</div>
            </div>
            <div>
              <div className="text-slate-200 font-semibold">Pacing</div>
              <div>Slow reveal / Trails on</div>
            </div>
            <div>
              <div className="text-slate-200 font-semibold">Interaction</div>
              <div>Click nodes to inspect payloads</div>
            </div>
          </div>
        </div>
        <div className="col-span-4 h-full">
          <ActivityFeed events={events} />
        </div>
      </div>
    </div>
  );
}
