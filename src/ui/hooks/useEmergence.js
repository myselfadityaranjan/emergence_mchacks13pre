import { useEffect, useMemo, useRef, useState } from "react";
import { mockEmergence } from "../mockData.js";

const API_STATE_URL =
  import.meta.env.VITE_EMERGENCE_STATE_API ||
  import.meta.env.VITE_EMERGENCE_API ||
  "http://localhost:4000/api/state";
const API_RUN_URL =
  import.meta.env.VITE_EMERGENCE_RUN_API ||
  (API_STATE_URL ? API_STATE_URL.replace(/state$/, "run") : null);
const POLL_MS = Number(import.meta.env.VITE_POLL_MS || 800);

export function useEmergence() {
  const [task, setTask] = useState(mockEmergence.task);
  const [agents, setAgents] = useState(mockEmergence.agents);
  const [links, setLinks] = useState(mockEmergence.links);
  const [events, setEvents] = useState(mockEmergence.events);
  const [synthesis, setSynthesis] = useState(mockEmergence.synthesis);
  const [status, setStatus] = useState("idle"); // idle | starting | running | complete | error
  const [error, setError] = useState(null);

  const pollRef = useRef(null);

  useEffect(() => {
    if (!API_STATE_URL || status !== "running") return undefined;

    const poll = async () => {
      try {
        const response = await fetch(API_STATE_URL);
        const data = await response.json();
        setAgents(data.agents || []);
        setLinks(data.links || []);
        setEvents((prev) => mergeEvents(prev, data.events || []));
        setSynthesis(data.synthesis || "");
        setStatus(data.status || "running");
      } catch (err) {
        console.error("Poll failed", err);
        setError("Connection lost. Falling back to mock.");
        setStatus("error");
      }
    };

    poll();
    pollRef.current = setInterval(poll, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [status]);

  useEffect(() => {
    if (API_URL) return undefined;
    if (status !== "running") return undefined;

    const sequence = [
      () =>
        appendEvent({
          type: "spawn",
          text: "Genesis spawned a researcher specialist",
        }),
      () =>
        bumpAgent("researcher-1", {
          state: "WORKING",
          load: 0.8,
        }),
      () =>
        appendEvent({
          type: "search",
          text: "Researcher web search: 'teen mental health onboarding patterns'",
        }),
      () =>
        bumpAgent("analyst-1", {
          state: "WORKING",
          load: 0.7,
        }),
      () =>
        appendEvent({
          type: "message",
          text: "Analyst → Designer: Prioritize calming palette & offline mode.",
        }),
      () =>
        bumpAgent("architect-1", {
          state: "COMPLETE",
          load: 0.2,
        }),
      () =>
        appendEvent({
          type: "complete",
          text: "Architect completed technical approach.",
        }),
      () => setStatus("complete"),
    ];

    let step = 0;
    const id = setInterval(() => {
      const action = sequence[step];
      if (action) action();
      step += 1;
      if (step >= sequence.length) clearInterval(id);
    }, 1200);

    return () => clearInterval(id);
  }, [status]);

  const appendEvent = (event) => {
    setEvents((prev) => [
      {
        id: `${event.type}-${Date.now()}`,
        ts: Date.now(),
        ...event,
      },
      ...prev,
    ]);
  };

  const bumpAgent = (id, patch) => {
    setAgents((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...patch } : a))
    );
  };

  const startEmergence = async (taskText) => {
    setTask(taskText);
    setError(null);

    if (API_RUN_URL) {
      setStatus("starting");
      try {
        const response = await fetch(API_RUN_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ task: taskText }),
        });
        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || "Failed to start run");
        }
        setStatus("running");
        setAgents([]);
        setLinks([]);
        setEvents([]);
        setSynthesis("");
        return;
      } catch (err) {
        console.error("Start failed, using mock", err);
        setError("API unavailable; using mock simulation.");
        setStatus("running");
      }
    } else {
      setStatus("running");
    }

    setAgents(mockEmergence.agents);
    setLinks(mockEmergence.links);
    setEvents(mockEmergence.events);
    setSynthesis("");
  };

  const graphData = useMemo(
    () => ({
      nodes: agents,
      links,
    }),
    [agents, links]
  );

  const stats = {
    total: agents.length,
    active: agents.filter((a) => a.state !== "COMPLETE").length,
    complete: agents.filter((a) => a.state === "COMPLETE").length,
    status,
  };

  return {
    task,
    setTask,
    agents,
    links,
    events,
    synthesis,
    status,
    error,
    stats,
    graphData,
    startEmergence,
  };
}

function mergeEvents(existing, incoming) {
  const seen = new Set(existing.map((e) => e.id));
  const merged = [...incoming.filter((e) => !seen.has(e.id)), ...existing];
  return merged.sort((a, b) => b.ts - a.ts);
}

export default useEmergence;
