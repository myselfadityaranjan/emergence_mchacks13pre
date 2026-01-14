export function useAnimation() {
  const eventColors = {
    spawn: "#00e5ff",
    message: "#ffd166",
    search: "#a855f7",
    complete: "#69ff97",
  };

  const eventBg = {
    spawn: "rgba(0,229,255,0.12)",
    message: "rgba(255,209,102,0.12)",
    search: "rgba(168,85,247,0.12)",
    complete: "rgba(105,255,151,0.12)",
  };

  const eventIcon = {
    spawn: "⚡",
    message: "✉️",
    search: "🔎",
    complete: "✅",
  };

  const speedForMessage = (type) => {
    if (type === "search") return 900;
    if (type === "spawn") return 700;
    if (type === "complete") return 600;
    return 800;
  };

  return {
    eventColors,
    eventBg,
    eventIcon,
    speedForMessage,
  };
}

export default useAnimation;
