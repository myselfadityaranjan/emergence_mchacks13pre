import MetricsPanel from "../components/MetricsPanel.jsx";
import ActivityFeed from "../components/ActivityFeed.jsx";

export default function ControlRoom({ stats, events }) {
  return (
    <div className="min-h-screen p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-cyber-purple">
            Control Room
          </div>
          <h2 className="text-2xl font-bold text-white">Systems & Telemetry</h2>
        </div>
        <span className="tag">Stability 60fps</span>
      </div>

      <div className="grid grid-cols-12 gap-4 h-[75vh]">
        <div className="col-span-5 h-full">
          <MetricsPanel stats={stats} />
        </div>
        <div className="col-span-7 h-full">
          <ActivityFeed events={events} />
        </div>
      </div>
    </div>
  );
}
