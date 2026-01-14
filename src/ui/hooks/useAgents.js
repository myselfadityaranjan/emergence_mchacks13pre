import { useMemo, useState } from "react";
import { roleColor } from "../mockData.js";

export function useAgents(agents = [], links = []) {
  const [selected, setSelected] = useState(null);

  const nodeMap = useMemo(() => {
    const map = new Map();
    agents.forEach((a) => map.set(a.id, a));
    return map;
  }, [agents]);

  const withMeta = useMemo(
    () =>
      agents.map((agent) => {
        const children = links
          .filter((l) => l.source === agent.id)
          .map((l) => l.target);
        return {
          ...agent,
          color: roleColor(agent.role),
          children,
        };
      }),
    [agents, links]
  );

  const selectAgent = (id) => setSelected(id);
  const clearSelection = () => setSelected(null);

  return {
    agents: withMeta,
    selected,
    nodeMap,
    selectAgent,
    clearSelection,
  };
}

export default useAgents;
