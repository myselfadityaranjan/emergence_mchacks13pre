import { useEffect, useMemo, useRef, useState } from "react";
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
} from "d3-force";
import AgentNode from "./AgentNode.jsx";
import ConnectionLine from "./ConnectionLine.jsx";

export default function NetworkGraph({ nodes = [], links = [], onSelect }) {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 1200, height: 720 });
  const [simNodes, setSimNodes] = useState([]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      setSize({
        width: el.clientWidth,
        height: el.clientHeight,
      });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!nodes.length) {
      setSimNodes([]);
      return undefined;
    }

    const initial = nodes.map((n, idx) => ({
      ...n,
      x: n.x || size.width / 2 + Math.cos(idx) * 150,
      y: n.y || size.height / 2 + Math.sin(idx) * 150,
    }));

    const sim = forceSimulation(initial)
      .force(
        "link",
        forceLink(links)
          .id((d) => d.id)
          .distance((d) =>
            d.source?.id === "genesis" || d.source === "genesis" ? 180 : 140
          )
          .strength(0.8)
      )
      .force("charge", forceManyBody().strength(-260))
      .force("center", forceCenter(size.width / 2, size.height / 2))
      .force("x", forceX(size.width / 2).strength(0.08))
      .force("y", forceY(size.height / 2).strength(0.08))
      .force("collide", forceCollide().radius(70).strength(0.8))
      .alpha(1)
      .alphaDecay(0.04)
      .on("tick", () => setSimNodes([...initial]));

    const genesisNode = initial.find((n) => n.role === "genesis");
    if (genesisNode) {
      genesisNode.fx = size.width / 2;
      genesisNode.fy = size.height / 2;
    }

    return () => sim.stop();
  }, [nodes, links, size.width, size.height]);

  const renderedLinks = useMemo(() => {
    if (!simNodes.length) return [];
    return links
      .map((link) => {
        const source =
          simNodes.find((n) => n.id === link.source?.id || n.id === link.source) ||
          simNodes[0];
        const target =
          simNodes.find((n) => n.id === link.target?.id || n.id === link.target) ||
          simNodes[1];
        if (!source || !target) return null;
        return { source, target, type: link.type || "spawn" };
      })
      .filter(Boolean);
  }, [links, simNodes]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full rounded-2xl overflow-hidden glass grid-overlay"
      style={{ minHeight: "480px" }}
    >
      <svg width={size.width} height={size.height} className="absolute inset-0">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {renderedLinks.map((link, idx) => (
          <ConnectionLine
            key={`${link.source.id}-${link.target.id}-${idx}`}
            source={link.source}
            target={link.target}
            type={link.type}
          />
        ))}

        {simNodes.map((node) => (
          <AgentNode key={node.id} node={node} onSelect={onSelect} />
        ))}
      </svg>
    </div>
  );
}
