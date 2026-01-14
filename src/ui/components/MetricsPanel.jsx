export default function MetricsPanel({ stats = {}, apiLatency = 120, memory = "128MB" }) {
  const items = [
    { label: "Agents", value: stats.total ?? 0 },
    { label: "Active", value: stats.active ?? 0 },
    { label: "Complete", value: stats.complete ?? 0 },
    { label: "Status", value: stats.status || "idle" },
    { label: "API Latency", value: `${apiLatency}ms` },
    { label: "Memory Use", value: memory },
  ];

  return (
    <div className="panel p-4 h-full">
      <h3 className="text-sm uppercase tracking-[0.18em] text-cyber-blue mb-4">
        Control Room
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-slate-800 bg-[rgba(255,255,255,0.03)] p-3"
          >
            <div className="text-xs text-slate-400">{item.label}</div>
            <div className="text-xl font-bold text-white">{item.value}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 text-xs text-slate-400 leading-relaxed">
        Agents run locally; Backboard calls mocked unless API URL is configured. Graph stays under
        60fps with d3-force tuned for 8-10 agents.
      </div>
    </div>
  );
}
