import { memo } from "react";
import { motion } from "framer-motion";

const statusGlow = {
  INITIALIZING: "shadow-[0_0_30px_rgba(0,240,255,0.8)]",
  ACTIVE: "shadow-[0_0_35px_rgba(176,38,255,0.8)]",
  WORKING: "shadow-[0_0_40px_rgba(57,255,20,0.9)]",
  COMPLETE: "shadow-[0_0_24px_rgba(255,0,110,0.6)]",
};

function AgentNode({ node, onSelect, isSelected = false }) {
  const color = node.color || "#00F0FF";
  const size = 50 + (node.load || 0) * 28;
  const burst = Array.from({ length: 10 }).map((_, i) => {
    const angle = (i / 10) * Math.PI * 2;
    return {
      dx: Math.cos(angle) * size * 0.9,
      dy: Math.sin(angle) * size * 0.9,
    };
  });

  const points = hexPoints(node.x, node.y, size / 2);

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      onClick={() => onSelect?.(node.id)}
      style={{ cursor: "pointer" }}
    >
      <defs>
        <radialGradient id={`glow-${node.id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.8" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>

      <polygon
        points={points}
        fill={`url(#glow-${node.id})`}
        opacity={0.4}
        style={{ filter: `drop-shadow(0 0 25px ${color})` }}
      />

      <motion.polygon
        points={points}
        fill="rgba(10,10,15,0.9)"
        stroke={color}
        strokeWidth="4"
        className={`${statusGlow[node.state] || ""}`}
        animate={
          node.state === "WORKING"
            ? { scale: [1, 1.05, 1] }
            : node.state === "INITIALIZING"
            ? { rotate: [0, 3, -3, 0] }
            : { scale: 1 }
        }
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      />

      {node.state === "INITIALIZING" &&
        burst.map((p, idx) => (
          <motion.circle
            key={idx}
            cx={node.x}
            cy={node.y}
            r={3 + (idx % 3)}
            fill={color}
            opacity={0.8}
            initial={{ x: 0, y: 0, scale: 0.4 }}
            animate={{ x: p.dx, y: p.dy, scale: 1, opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: idx * 0.02 }}
          />
        ))}

      {node.state === "WORKING" && (
        <polygon
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          opacity={0.5}
          className="animate-[ping_2s_ease_infinite]"
        />
      )}

      {node.state === "INITIALIZING" && (
        <g transform={`translate(${node.x - size / 2}, ${node.y - size / 2})`}>
          <rect
            width={size}
            height={size}
            fill="rgba(255,255,255,0.05)"
            className="code-rain"
          />
        </g>
      )}

      <text
        x={node.x}
        y={node.y + 2}
        textAnchor="middle"
        fontFamily="Share Tech Mono, monospace"
        fontSize="14"
        fill="#00F0FF"
        fontWeight="700"
        style={{ textShadow: "0 0 12px rgba(0,240,255,0.8)" }}
      >
        {node.role || labelForRole(node.role)}
      </text>

      <text
        x={node.x}
        y={node.y + 18}
        textAnchor="middle"
        fontFamily="Space Grotesk, sans-serif"
        fontSize="11"
        fill="#bcd7ff"
        opacity={0.9}
      >
        {node.model || "auto-model"}
      </text>

      {isSelected && (
        <polygon
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeDasharray="6 6"
          opacity={0.9}
        />
      )}
    </motion.g>
  );
}

function hexPoints(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return pts.join(" ");
}

function labelForRole(role) {
  if (!role) return "?";
  if (role === "genesis") return "G";
  return role[0]?.toUpperCase() || "?";
}

export default memo(AgentNode);
