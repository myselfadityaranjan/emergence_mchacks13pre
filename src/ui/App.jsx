import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import GenesisInput from "./screens/GenesisInput.jsx";
import EmergenceView from "./screens/EmergenceView.jsx";
import ControlRoom from "./screens/ControlRoom.jsx";
import SynthesisView from "./screens/SynthesisView.jsx";
import useEmergence from "./hooks/useEmergence.js";
import useAgents from "./hooks/useAgents.js";
import BackgroundFX from "./components/BackgroundFX.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import StatusBanner from "./components/StatusBanner.jsx";

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
    error,
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
      return <GenesisInput task={task} onTaskChange={setTask} onStart={handleStart} status={status} />;
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
          status={status}
        />
      );
    }
    if (view === "control") {
      return <ControlRoom stats={stats} events={events} />;
    }
    return <SynthesisView synthesis={synthesis} agents={agentMeta} task={task} />;
  };

  return (
    <div className="min-h-screen relative text-white">
      <BackgroundFX />
      <div className="relative z-10">
        <ErrorBoundary>
          <nav className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[rgba(0,229,255,0.15)] flex items-center justify-center text-cyber-blue font-bold">
                E
              </div>
              <div>
                <div
                  className="text-xs uppercase tracking-[0.3em] text-cyber-purple glitch"
                  data-text="Emergence"
                >
                  Emergence
                </div>
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

          <StatusBanner status={status} message={error} />

          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </ErrorBoundary>
      </div>
    </div>
  );
}
