# EMERGENCE Demo Script (3–5 minutes)

## 0:00–0:20 — Hook
- “What if AI could organize itself? Not just a single model, but a whole neural collective spawning specialists on demand.”
- “Meet **EMERGENCE**: a self-organizing AI swarm with a live cyberpunk neural network.”

## 0:20–1:00 — Problem
- “Complex work (product strategy, research, design) needs coordination, not just answers.”
- “We usually juggle PMs, designers, architects, researchers—slow handoffs, context loss.”
- “EMERGENCE auto-decomposes tasks, spawns the right agents, and keeps them aligned via a message bus + shared memory.”

## 1:00–2:30 — Live Demo (medium task: Design a mobile app for mental health)
- “Hit **Initiate Emergence** with the task.”
- Call out UI: glitching title, scanlines, neural particles, force-directed graph.
- “Genesis decomposes the task, spawns 4–5 agents: Researcher, Analyst, Architect, Designer, Coordinator.”
- Point at graph: “Nodes glow when active; links pulse when messages move; radar rings on web searches.”
- Activity feed: “Here’s a spawn event, then a search, then messages Analyst → Architect.”
- Control Room: metrics (agents active/complete, API latency). “We’re running locally; Backboard calls mock if no key.”
- SynthesisView: “Genesis stitches all outputs into a cohesive plan.”

## 2:30–3:00 — Technical Highlights
- “Backboard routing: GPT-4 for planning, Claude for creative, Llama for speed.”
- “Backboard memory: per-agent state at `agent:{id}:state`, plus parent-child inheritance.”
- “RAG collection `emergences` for similar-task recall; web search tool for research agents.”
- “d3-force graph tuned for 60fps; framer-motion for spawn/message/search animations.”

## 3:00–3:30 — Vision
- “Expand to multi-depth specialists, richer tools, and human-in-the-loop approvals.”
- “Portable to edge devices; could orchestrate robotics, DevOps, or live ops rooms.”
- “EMERGENCE hints at AI swarms that self-direct complex workflows in real time.”
