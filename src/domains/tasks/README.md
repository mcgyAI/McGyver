# Phase 2 - Tasks & projects

Goal: turn "remind me to..." / "add to the X project..." into structured,
queryable tasks instead of just remembered as chat history.

Build order:
1. Define a Task schema (title, project, due date, status) and a Mongo
   collection for it, owned by this service only.
2. Implement `Planner.plan()` to turn a request into PlanStep[] against
   that schema.
3. Add a branch in `Router.ts` that detects task intent and calls the
   Planner before falling through to plain chat.
4. Add a `/tasks` route to list/update tasks directly (not just via chat).
