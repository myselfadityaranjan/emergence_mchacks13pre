import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import GenesisInput from "./screens/GenesisInput.jsx";
import MissionControl from "./screens/MissionControl.jsx";
import SynthesisView from "./screens/SynthesisView.jsx";
import useEmergence from "./hooks/useEmergence.js";
import useAgents from "./hooks/useAgents.js";
import BackgroundFX from "./components/BackgroundFX.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import StatusBanner from "./components/StatusBanner.jsx";

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
    synthesisReady,
    startEmergence,
    error,
  } = useEmergence();

  const { agents: agentMeta, selected, selectAgent, clearSelection } = useAgents(
    agents,
    graphData.links
  );

  const handleStart = (mission) => {
    startEmergence(mission);
    setView("mission");
  };

  const renderView = () => {
    if (view === "input") {
      return <GenesisInput task={task} onTaskChange={setTask} onStart={handleStart} status={status} />;
    }
    if (view === "mission") {
      return (
        <MissionControl
          task={task}
          graphData={graphData}
          events={events}
          agents={agentMeta}
          selectedAgent={selected}
          onSelectAgent={(id) => (id ? selectAgent(id) : clearSelection())}
          status={status}
          stats={stats}
        />
      );
    }
    return (
      <SynthesisView
        synthesis={synthesis}
        agents={agentMeta}
        task={task}
        ready={synthesisReady && status === "complete"}
      />
    );
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
              <button className={`tab ${view === "input" ? "tab-active" : ""}`} onClick={() => setView("input")}>
                Genesis
              </button>
              <button
                className={`tab ${view === "mission" ? "tab-active" : ""}`}
                onClick={() => setView("mission")}
                disabled={status === "idle"}
              >
                Mission Control
              </button>
              <button
                className={`tab ${view === "synthesis" ? "tab-active" : ""}`}
                onClick={() => setView("synthesis")}
                disabled={status !== "complete"}
              >
                Synthesis
              </button>
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
