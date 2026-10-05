# Design Document — NewsDeck

## Architecture

```
10 RSS/Atom feeds
      │  (Promise.allSettled, 12s timeout each)
      ▼
server/fetch.ts ── normalizeEntry() ── tagItem() ──► shared/ (pure)
      │                                               dedupeItems()
      │                                               sortByDateDesc()
      ▼
Snapshot {fetchedAt, items, errors} ──► server/data/snapshot.json
      │
      ▼  GET /api/items · POST /api/refresh · GET /api/health
React SPA (src/) ── applyFilters() ── localStorage TriageState
```

Layers:

- **shared/** — pure TypeScript. No I/O, no DOM, no clocks inside exported
  functions. Everything here is property-testable.
- **server/** — Express + rss-parser. The only place feeds and disk are
  touched.
- **src/** — React 19 SPA. Server state via `src/api.ts`; triage state via
  `src/state.ts` (localStorage).
- **mcp-server/** — zero-dependency Node stdio MCP server exposing the
  snapshot to agent tools.

## Data model

See `shared/types.ts`. `NewsItem.id = stableId(canonicalizeUrl(url))` — an
FNV-1a hash, stable across runs and machines. `FilterSet` composes
`sourceId | status | tag | query` conjunctively.

## Correctness Properties

The following 16 properties are exercised by fast-check in `tests/` (7 dedupe,
5 filters, 4 tagger). An additional plain example-based test asserts that known
keywords land their tag, for 17 `it(...)` cases total.

1. **Dedupe idempotence** — `dedupeItems(dedupeItems(xs)) == dedupeItems(xs)`
2. **Dedupe order-preserving subset** — output ⊆ input, in first-occurrence
   order
3. **Dedupe URL uniqueness** — no two outputs share a canonical URL
4. **Tracking-param collapse** — items differing only in `utm_*`-style query
   params dedupe to one
5. **Sort totality** — `sortByDateDesc` returns a same-length permutation,
   `publishedAt` non-increasing, `id` ascending on ties
6. **Canonicalize idempotence** — `canonicalizeUrl(canonicalizeUrl(u)) ==
   canonicalizeUrl(u)` and output never contains `utm_`
7. **htmlToText safety** — never throws; never leaks literal markup tags
8. **Filter subset law** — `applyFilters` output ⊆ input
9. **Filter composition symmetry** — source/status/tag/query commute
10. **Empty-filter identity** — cleared filters return input unchanged
11. **Case-insensitive search** — upper/lower queries match identically
12. **Status complements** — unread ↔ ¬read, starred ↔ starred flag, etc.
13. **Tagger determinism** — same input+rules ⇒ same sorted-unique output
14. **Tagger closure** — output tags ⊆ declared rule tags
15. **Tagger monotonicity** — adding a matching keyword never drops a tag
16. **Normalize robustness** — `normalizeEntry` returns null, never throws,
    on arbitrary input; valid output always has 8-hex id, nonempty
    title/url, parseable ISO date

## Error model

Feed failures funnel into `Snapshot.errors[]` and a UI warning banner. The
board renders whatever the snapshot holds — including a stale one — so no
single feed outage can blank the app.

`refresh()` holds a single in-flight promise: concurrent `/api/refresh`
requests (and the startup background refresh) are coalesced into the one
running fetch and all await its result (R1.5), so overlapping refreshes never
race or double-write the snapshot.

## MCP server

`mcp-server/index.mjs` implements newline-delimited JSON-RPC 2.0
(`initialize`, `tools/list`, `tools/call`, `ping`) with zero dependencies.
Tools: `list_sources`, `latest_news`, `news_stats`. The packaged power in
`power-newsdeck/` points at `npx -y github:HY3YH/ai-news-triage` so the same
tools work from any project.
