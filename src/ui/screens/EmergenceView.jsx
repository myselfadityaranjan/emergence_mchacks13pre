import NetworkGraph from "../components/NetworkGraph.jsx";
import ActivityFeed from "../components/ActivityFeed.jsx";
import AgentCard from "../components/AgentCard.jsx";

export default function EmergenceView({
  task,
  graphData,
  events,
  agents,
  selectedAgent,
  onSelectAgent,
}) {
  const agentMap = new Map(agents.map((a) => [a.id, a]));

  return (
    <div className="min-h-screen p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-cyber-purple">Emergence</div>
          <h2 className="text-2xl font-bold text-white">{task}</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="tag">Real-time</span>
          <span className="tag">{graphData.nodes.length} Agents</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 h-[75vh]">
        <div className="col-span-8 relative">
          <NetworkGraph
            nodes={graphData.nodes}
            links={graphData.links}
            onSelect={(id) => onSelectAgent?.(id)}
          />
          <AgentCard agent={agentMap.get(selectedAgent)} onClose={() => onSelectAgent?.(null)} />
        </div>
        <div className="col-span-4 h-full">
          <ActivityFeed events={events} />
        </div>
      </div>
    </div>
  );
}
