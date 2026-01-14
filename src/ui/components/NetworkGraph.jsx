import { memo, useEffect, useMemo, useRef, useState } from "react";
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
import GraphParticles from "./GraphParticles.jsx";

function sanitizeNodes(nodes = []) {
  const seen = new Set();
  return nodes
    .filter((n) => n && n.id)
    .filter((n) => {
      if (seen.has(n.id)) return false;
      seen.add(n.id);
      return true;
    });
}

function sanitizeLinks(links = [], nodeIds = new Set()) {
  return links
    .filter((l) => l && (l.source || l.target))
    .map((l) => ({
      source: typeof l.source === "object" ? l.source.id : l.source,
      target: typeof l.target === "object" ? l.target.id : l.target,
      type: l.type || "spawn",
    }))
    .filter((l) => nodeIds.has(l.source) && nodeIds.has(l.target));
}

function NetworkGraph({ nodes = [], links = [], onSelect }) {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 1200, height: 720 });
  const [simNodes, setSimNodes] = useState([]);
  const [ready, setReady] = useState(false);

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
    setReady(true);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const safeNodes = sanitizeNodes(nodes);
    if (!ready || safeNodes.length === 0) {
      setSimNodes([]);
      return undefined;
    }

    const nodeIds = new Set(safeNodes.map((n) => n.id));
    const safeLinks = sanitizeLinks(links, nodeIds);

    const initial = safeNodes.map((n, idx) => ({
      ...n,
      x: n.x || size.width / 2 + Math.cos(idx) * 150,
      y: n.y || size.height / 2 + Math.sin(idx) * 150,
    }));

    try {
      const sim = forceSimulation(initial)
        .force(
          "link",
          forceLink(safeLinks)
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
    } catch (err) {
      console.error("[NetworkGraph] Simulation error", err);
      setSimNodes(initial);
      return undefined;
    }
  }, [nodes, links, size.width, size.height, ready]);

  const renderedLinks = useMemo(() => {
    if (!simNodes.length) return [];
    return links
      .map((link) => {
        const source =
          simNodes.find((n) => n.id === link.source?.id || n.id === link.source) ||
          null;
        const target =
          simNodes.find((n) => n.id === link.target?.id || n.id === link.target) ||
          null;
        if (!source || !target) return null;
        return { source, target, type: link.type || "spawn" };
      })
      .filter(Boolean);
  }, [links, simNodes]);

  if (!ready) return <div ref={containerRef} className="w-full h-full" />;
  if (!nodes || nodes.length === 0) {
    return (
      <div
        ref={containerRef}
        className="relative w-full h-full rounded-2xl overflow-hidden glass grid-overlay flex items-center justify-center text-slate-400"
        style={{ minHeight: "320px" }}
      >
        Waiting for agents...
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full rounded-2xl overflow-hidden glass grid-overlay bg-[rgba(10,10,15,0.9)]"
      style={{ minHeight: "520px" }}
    >
      <GraphParticles />
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

export default memo(NetworkGraph);
