# NewsDeck project setup

NewsDeck = RSS fetch server + React triage board + local snapshot cache.

## Run it

- `npm install` then `npm run dev` — API on :8787, Vite on :5173.
- `npm run snapshot` re-fetches all feeds into `server/data/snapshot.json`.
- `npm test` runs the property-based suite (vitest + fast-check).

## Key Conventions

- Follow `.kiro/steering/typescript-style.md` for all code.
- Pure logic only in `shared/` — no I/O, no `Date.now()` in exported fns.
- Feed changes go in `server/feeds.ts`; the saving hook validates it.
- Item id = `stableId(canonicalizeUrl(url))`; never array indices.
- Triage state (read/starred/later) stays in localStorage — never POST it.
