import { motion } from "framer-motion";
import { useAnimation } from "../hooks/useAnimation.js";

export default function ConnectionLine({ source, target, type = "spawn" }) {
  const { speedForMessage } = useAnimation();
  const color = type === "message" ? "#ffd166" : type === "search" ? "#a855f7" : "#00e5ff";

  const duration = speedForMessage(type) / 1000;

  return (
    <g>
      <line
        x1={source.x}
        y1={source.y}
        x2={target.x}
        y2={target.y}
        stroke={color}
        strokeOpacity="0.85"
        strokeWidth={type === "spawn" ? 3 : 2}
        strokeLinecap="round"
        className="line-animate"
        style={{ filter: `drop-shadow(0 0 10px ${color})` }}
      />

      <motion.circle
        r={5}
        fill={color}
        initial={{ cx: source.x, cy: source.y, opacity: 0.9 }}
        animate={{ cx: target.x, cy: target.y, opacity: [0.2, 1, 0.2] }}
        transition={{
          repeat: Infinity,
          duration,
          ease: "linear",
        }}
        filter="url(#glow)"
      />
    </g>
  );
}
