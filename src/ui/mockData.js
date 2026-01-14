export const mockEmergence = {
  task: "Design a mobile app for mental health",
  synthesis:
    "A calming, privacy-first companion app with mood tracking, CBT micro-practices, crisis shortcuts, and a supportive AI guide.",
  agents: [
    {
      id: "genesis",
      role: "genesis",
      state: "ACTIVE",
      parentId: null,
      depth: 1,
      load: 0.4,
    },
    {
      id: "researcher-1",
      role: "researcher",
      state: "WORKING",
      parentId: "genesis",
      depth: 2,
      load: 0.6,
    },
    {
      id: "analyst-1",
      role: "analyst",
      state: "ACTIVE",
      parentId: "genesis",
      depth: 2,
      load: 0.5,
    },
    {
      id: "architect-1",
      role: "architect",
      state: "WORKING",
      parentId: "genesis",
      depth: 2,
      load: 0.7,
    },
    {
      id: "designer-1",
      role: "designer",
      state: "INITIALIZING",
      parentId: "genesis",
      depth: 2,
      load: 0.3,
    },
  ],
  links: [
    { source: "genesis", target: "researcher-1", type: "spawn" },
    { source: "genesis", target: "analyst-1", type: "spawn" },
    { source: "genesis", target: "architect-1", type: "spawn" },
    { source: "genesis", target: "designer-1", type: "spawn" },
  ],
  events: [
    {
      id: "e1",
      type: "spawn",
      text: "Genesis spawned Researcher",
      ts: Date.now() - 18000,
    },
    {
      id: "e2",
      type: "spawn",
      text: "Genesis spawned Analyst",
      ts: Date.now() - 16000,
    },
    {
      id: "e3",
      type: "search",
      text: "Researcher searching: mindfulness app trends 2024",
      ts: Date.now() - 12000,
    },
    {
      id: "e4",
      type: "message",
      text: "Analyst → Architect: User privacy is critical; suggest on-device processing.",
      ts: Date.now() - 8000,
    },
    {
      id: "e5",
      type: "complete",
      text: "Architect delivered technical approach",
      ts: Date.now() - 4000,
    },
  ],
};

export function roleColor(role) {
  switch (role) {
    case "genesis":
      return "#00e5ff";
    case "designer":
    case "coordinator":
      return "#a855f7";
    case "analyst":
    case "architect":
      return "#69ff97";
    case "researcher":
      return "#ffd166";
    default:
      return "#8b9bb4";
  }
}
