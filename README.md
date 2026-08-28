# Mc'Gyver — private personal AI

This is **not** Mc'Gy. It shares a foundation pattern (registries, a
router, phase-gated capability modules) but nothing else:

- **Different database.** Set `MONGO_URL` to a database Mc'Gy has no
  credentials for — ideally a different cluster entirely, not just a
  different collection name in the same one.
- **Different auth.** One owner token (`OWNER_TOKEN`), not Firebase, not
  multi-user. If you ever find yourself adding a signup flow here, stop —
  that means Mc'Gy features are leaking into this repo.
- **Different deploy target.** Do not put this behind the same CORS
  allowlist as Beepa/BhekaMe. `ALLOWED_ORIGINS` in `.env` should only ever
  contain origins you personally control.
- **Different repo.** This folder should become its own git repo, not a
  subfolder of `mcgy-ai`.

If any of those four boundaries gets blurred, you've rebuilt "one app with
an owner mode" — the exact thing the product vision doc rules out.

## Status: all four phases built

| Phase | Area | What it does |
|---|---|---|
| 0 | Foundation | Owner-token auth, private Mongo (with in-memory fallback if unreachable), provider-agnostic LLM, persistent chat memory |
| 1 | Knowledge base | Add notes/documents via chat or the Notes panel; relevance-scored search feeds context into every chat reply |
| 2 | Tasks & projects | "Remind me to..." / "what's pending" / "mark X done" through chat, or the Tasks panel directly - no LLM call needed for direct add/complete |
| 3 | Automation | `ConnectorManager` + `toolRegistry` framework; one working connector (local file read/list) with zero setup required |
| 4 | Voice | Push-to-talk mic button: audio to STT to the same chat pipeline to TTS to spoken reply |

Everything routes through one function - `src/core/router/Router.ts` -
whether it arrives as typed text or spoken audio. Voice is a thin layer on
top, not a separate reasoning path.

## Running it

```bash
npm install
cp .env.example .env
```

Then edit `.env`:
- **Required:** `OWNER_TOKEN` (generate one), `MONGO_URL` (or leave the
  default - it'll run on in-memory storage if nothing's listening there),
  one LLM provider's key (`LLM_PROVIDER` + matching `*_API_KEY`)
- **Optional:** `FILES_DIR` (defaults to a `files/` folder in this
  project), `STT_PROVIDER`/`TTS_PROVIDER` + keys (only needed for the mic
  button - text chat works fully without them)

```bash
npm run dev
```

Open **http://localhost:4000** — paste your `OWNER_TOKEN` when asked, and
that's it. Everything else (chat, notes, tasks, files, voice) is in the
page, no terminal commands needed after this point.

## Extending it further

**Adding a real connector** (calendar, email, home automation): write one
file in `src/domains/automation/` following the shape of
`filesConnector.ts` — register tools into `toolRegistry`, add one line to
`ConnectorManager.registerAll()`. `Router.ts` and the tool-classification
logic in `toolRouting.ts` need no changes; any registered tool is
automatically eligible to be called from chat.

**Swapping models/providers:** every provider (LLM, STT, TTS) is chosen by
one `.env` variable and implements the same function shape in its
respective service file — changing providers never requires touching the
code that calls them.

**Security boundary reminder:** the `files.read`/`files.list` connector is
scoped to `FILES_DIR` only, with a path-traversal check — if you add
connectors with broader system access (running commands, writing files,
network requests to arbitrary hosts), think through the blast radius
before wiring them into chat, since chat-triggered tool calls are decided
by the LLM's classification, not something you approve per-call.
