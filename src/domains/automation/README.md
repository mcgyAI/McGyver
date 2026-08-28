# Phase 3 - Automation / operating your other tools

Goal: Mc'Gyver can actually do things in the systems you already use, not
just talk about them.

Build order:
1. Pick ONE tool you'll use daily (calendar is usually the highest value)
   and build a real connector for it in `ConnectorManager.ts`.
2. Register its actions into `toolRegistry`.
3. Add a branch in `Router.ts` (or extend the Planner) that recognizes
   when a request maps to a registered tool and calls it.
4. Only then add `WorkerManager` for standing/background jobs (e.g. a
   morning briefing) - proactive automation is easiest to get right once
   reactive tool-calling already works.
