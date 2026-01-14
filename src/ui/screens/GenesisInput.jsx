export default function GenesisInput({ task, onTaskChange, onStart, status = "idle" }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onStart?.(task);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-10">
      <div className="max-w-4xl w-full panel p-10 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-70 grid-overlay" />
        <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-[rgba(0,229,255,0.12)] blur-3xl" />
        <div className="absolute -left-24 bottom-0 w-64 h-64 rounded-full bg-[rgba(168,85,247,0.18)] blur-3xl" />

        <div className="relative">
          <div className="text-sm uppercase tracking-[0.3em] text-cyber-purple mb-3">
            Genesis Console
          </div>
          <h1
            className="text-4xl font-bold text-white mb-4 leading-tight glitch"
            data-text="Ignite the EMERGENCE"
          >
            Ignite the <span className="text-cyber-blue">EMERGENCE</span>
          </h1>
          <p className="text-slate-300 mb-6">
            Describe the mission. Genesis will decompose, spawn the collective, and visualize the
            neural network as it self-organizes in real-time.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              className="input-cyber min-h-[140px]"
              value={task}
              onChange={(e) => onTaskChange?.(e.target.value)}
              placeholder="Ex: Design a mobile app for mental health"
            />
            <div className="flex items-center gap-3">
              <button type="submit" className="cyber-button" disabled={status === "starting"}>
                {status === "starting" ? "Booting..." : "Initiate Emergence"}
              </button>
              <span className="tag">Max 10 agents · 60fps graph</span>
              <span className="tag">{status}</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
