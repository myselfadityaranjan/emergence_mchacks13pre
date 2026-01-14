import { useState } from "react";
import GenesisInput from "./screens/GenesisInput.jsx";
import EmergenceView from "./screens/EmergenceView.jsx";
import ControlRoom from "./screens/ControlRoom.jsx";
import SynthesisView from "./screens/SynthesisView.jsx";
import useEmergence from "./hooks/useEmergence.js";
import useAgents from "./hooks/useAgents.js";

const views = [
  { key: "input", label: "Genesis" },
  { key: "emergence", label: "Emergence" },
  { key: "control", label: "Control Room" },
  { key: "synthesis", label: "Synthesis" },
];

export default function App() {
  const [view, setView] = useState("input");
  const {
    task,
    setTask,
    graphData,
    events,
    agents,
    status,
    stats,
    synthesis,
    startEmergence,
  } = useEmergence();

  const { agents: agentMeta, selected, selectAgent, clearSelection } = useAgents(
    agents,
    graphData.links
  );

  const handleStart = (mission) => {
    startEmergence(mission);
    setView("emergence");
  };

  const renderView = () => {
    if (view === "input") {
      return <GenesisInput task={task} onTaskChange={setTask} onStart={handleStart} />;
    }
    if (view === "emergence") {
      return (
        <EmergenceView
          task={task}
          graphData={graphData}
          events={events}
          agents={agentMeta}
          selectedAgent={selected}
          onSelectAgent={(id) => (id ? selectAgent(id) : clearSelection())}
        />
      );
    }
    if (view === "control") {
      return <ControlRoom stats={stats} events={events} />;
    }
    return <SynthesisView synthesis={synthesis} agents={agentMeta} task={task} />;
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,rgba(0,229,255,0.08),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(255,45,149,0.1),transparent_30%),radial-gradient(circle_at_60%_70%,rgba(105,255,151,0.1),transparent_30%),#05060a] text-white">
      <nav className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[rgba(0,229,255,0.15)] flex items-center justify-center text-cyber-blue font-bold">
            E
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-cyber-purple">Emergence</div>
            <div className="text-lg font-semibold">Cyber Collective</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {views.map((tab) => (
            <button
              key={tab.key}
              className={`tab ${view === tab.key ? "tab-active" : ""}`}
              onClick={() => setView(tab.key)}
            >
              {tab.label}
            </button>
          ))}
          <span className="tag">Status: {status}</span>
        </div>
      </nav>
      {renderView()}
    </div>
  );
}
