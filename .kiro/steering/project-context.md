# Project context — NewsDeck

NewsDeck is a single-user AI news triage board built for the Kiro University
Challenge (Sept–Oct 2026).

## Architecture at a glance

```
RSS feeds ──> server/fetch.ts ──> normalize + dedupe + tag (shared/) ──> snapshot.json
                                              │
/api/items <── server/index.ts (Express) <────┘
      │
      ▼
React SPA (src/) ── applyFilters (shared/) ── localStorage triage state
```

- Feed registry: `server/feeds.ts` — id, name, url, accent color, lang.
- Data contract: `shared/types.ts` (`NewsItem`, `TriageState`, `FilterSet`,
  `Snapshot`). Change here first; everything else follows it.
- The app must still render from `server/data/snapshot.json` when every feed
  is unreachable — the demo depends on it.

## Conventions

- Item identity = `stableId(canonicalizeUrl(url))`. Never use array index as
  a key or id.
- Triage state (read/starred/later) is client-only. The server never sees it.
- New tag = append to `DEFAULT_TAG_RULES` in `shared/tagger.ts` (keep
  keywords lowercase, add Japanese terms where useful).
