import { memo } from "react";
import { motion } from "framer-motion";

const statusGlow = {
  INITIALIZING: "shadow-[0_0_20px_rgba(0,229,255,0.6)]",
  ACTIVE: "shadow-[0_0_25px_rgba(168,85,247,0.5)]",
  WORKING: "shadow-[0_0_30px_rgba(105,255,151,0.6)]",
  COMPLETE: "shadow-[0_0_15px_rgba(255,209,102,0.4)]",
};

function AgentNode({ node, onSelect, isSelected = false }) {
  const color = node.color || "#00e5ff";
  const size = 36 + (node.load || 0) * 22;
  const burst = Array.from({ length: 8 }).map((_, i) => {
    const angle = (i / 8) * Math.PI * 2;
    return {
      dx: Math.cos(angle) * size * 0.8,
      dy: Math.sin(angle) * size * 0.8,
    };
  });

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

      <circle
        cx={node.x}
        cy={node.y}
        r={size * 0.55}
        fill={`url(#glow-${node.id})`}
        opacity={0.6}
      />

      <motion.circle
        cx={node.x}
        cy={node.y}
        r={size / 2}
        fill={color}
        className={`glow ${statusGlow[node.state] || ""}`}
        style={{ filter: "drop-shadow(0 0 12px rgba(0,0,0,0.45))" }}
        animate={
          node.state === "WORKING"
            ? { scale: [1, 1.06, 1] }
            : { scale: 1 }
        }
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
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
        <circle
          cx={node.x}
          cy={node.y}
          r={size * 0.7}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
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
        y={node.y + 4}
        textAnchor="middle"
        fontFamily="Share Tech Mono, monospace"
        fontSize="12"
        fill="#05060a"
        fontWeight="700"
      >
        {labelForRole(node.role)}
      </text>

      <text
        x={node.x}
        y={node.y + size * 0.9}
        textAnchor="middle"
        fontFamily="Space Grotesk, sans-serif"
        fontSize="12"
        fill="#d9e9ff"
        opacity={0.9}
      >
        {node.id}
      </text>

      {isSelected && (
        <circle
          cx={node.x}
          cy={node.y}
          r={size * 0.75}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeDasharray="6 6"
          opacity={0.8}
        />
      )}
    </motion.g>
  );
}

function labelForRole(role) {
  if (!role) return "?";
  if (role === "genesis") return "G";
  return role[0]?.toUpperCase() || "?";
}

export default memo(AgentNode);
