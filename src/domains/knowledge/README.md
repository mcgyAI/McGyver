# Phase 1 - Knowledge base + research

Goal: ingest documents/notes/conversations and retrieve them by relevance,
not just keyword match.

Build order:
1. Wire `ParserManager.ingestText()` to a real `/knowledge/add` route.
2. Swap `knowledgeRegistry`'s internals from substring search to embeddings
   (Mongo Atlas Vector Search is the path of least resistance since you're
   already on Mongo).
3. Add PDF/URL parsing to `ParserManager`.
4. Have `Router.ts` call knowledge search on every message, not just when
   pre-seeded data happens to match.
