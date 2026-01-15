export function demoDecomposition(task) {
  return [
    { title: "Market research", role: "researcher", description: `Research ${task} trends and competitors.` },
    { title: "Insight analysis", role: "analyst", description: `Analyze user needs and risks for ${task}.` },
    { title: "Technical approach", role: "architect", description: `Design architecture and stack for ${task}.` },
    { title: "Experience design", role: "designer", description: `Outline UX flows and content for ${task}.` },
  ];
}

export function demoAgentResult(role, task) {
  const snippets = {
    researcher: `Top trends: AI personalization, privacy-first design, offline-first. Competitors mapped; gaps: community support + actionable insights.`,
    analyst: `Risks: data privacy, engagement drop-off, trust. Recommendations: transparent data handling, daily rituals, crisis shortcuts.`,
    architect: `Stack: React Native, offline SQLite, optional Firebase sync, encryption at rest. Services: auth, telemetry, crash reporting.`,
    designer: `UX: calming palette, 3-tap flows, streaks for habits, adaptive content. Screens: Onboarding, Daily Check-in, Insights, Community.`,
    coordinator: `Next steps: finalize scope, align on MVP success metrics, prepare launch messaging.`,
  };
  return {
    role,
    task,
    model: "demo",
    output: snippets[role] || `Demo output for ${role} on ${task}`,
  };
}
