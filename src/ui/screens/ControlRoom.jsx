import MetricsPanel from "../components/MetricsPanel.jsx";
import ActivityFeed from "../components/ActivityFeed.jsx";

export default function ControlRoom({ stats, events }) {
  return (
    <div className="min-h-screen p-6 space-y-4">
      <div className="panel p-4 flex items-center justify-between relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_20%_20%,rgba(0,240,255,0.12),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(255,0,110,0.12),transparent_40%)]" />
        <div className="relative">
          <div className="text-xs uppercase tracking-[0.3em] text-cyber-purple">
            Control Room
          </div>
          <h2 className="text-2xl font-bold text-white">Systems & Telemetry</h2>
          <p className="text-xs text-slate-400 mt-1">
            Live vitals, bandwidth, and agent health with slowed transitions for demo clarity.
          </p>
        </div>
        <div className="relative flex items-center gap-2">
          <span className="tag">Stability 60fps</span>
          <span className="tag">Interactive HUD</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 h-[75vh]">
        <div className="col-span-5 h-full space-y-3">
          <MetricsPanel stats={stats} />
          <div className="panel p-3 h-[35%] text-xs text-slate-300 grid grid-cols-2 gap-3">
            <div>
              <div className="text-slate-100 font-semibold">Signal Map</div>
              <div className="text-cyber-blue">Latency normalized</div>
            </div>
            <div>
              <div className="text-slate-100 font-semibold">Thermals</div>
              <div className="text-cyber-purple">Cooling nominal</div>
            </div>
            <div>
              <div className="text-slate-100 font-semibold">Bandwidth</div>
              <div>Throttled for cinematic pacing</div>
            </div>
            <div>
              <div className="text-slate-100 font-semibold">Memory Ops</div>
              <div>Vector reads active • writes gated</div>
            </div>
          </div>
        </div>
        <div className="col-span-7 h-full">
          <ActivityFeed events={events} />
        </div>
      </div>
    </div>
  );
}
