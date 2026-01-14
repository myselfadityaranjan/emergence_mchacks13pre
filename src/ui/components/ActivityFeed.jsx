import { useEffect, useRef } from "react";
import { useAnimation } from "../hooks/useAnimation.js";

export default function ActivityFeed({ events = [] }) {
  const { eventColors, eventBg, eventIcon } = useAnimation();
  const listRef = useRef(null);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTo({ top: 0, behavior: "smooth" });
  }, [events]);

  return (
    <div className="panel h-full p-3 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm uppercase tracking-[0.2em] text-cyber-blue">
          Activity Feed
        </h3>
        <span className="tag">Live</span>
      </div>
      <div ref={listRef} className="flex-1 overflow-y-auto scroll-thin space-y-2">
        {(!events || events.length === 0) && (
          <div className="text-sm text-slate-400">Waiting for activity...</div>
        )}
        {(events || []).map((event) => (
          <div
            key={event.id}
            className="rounded-lg p-2 text-sm flex items-start gap-2"
            style={{ background: eventBg[event.type] || "rgba(255,255,255,0.04)" }}
          >
            <span style={{ color: eventColors[event.type] || "#8b9bb4" }}>
              {eventIcon[event.type] || "•"}
            </span>
            <div>
              <div className="text-slate-100">{event.text}</div>
              <div className="text-[11px] text-slate-400">
                {new Date(event.ts).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
