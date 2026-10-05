# Submission notes — Kiro University Challenge

Reference text for the entry form + X post. (Not part of the app.)

## Short description (2–3 sentences, for X post and form)

NewsDeck is an AI news triage board: a Node server pulls ten RSS feeds,
normalizes/dedupes/auto-tags every item, and a React board lets me filter,
star, and clear what's done — all offline-resilient via a snapshot cache.
Built with Kiro: spec-first, steered, hooked, property-tested, powered,
MCP-wired, and agent-assisted.

## How each lesson was incorporated (form writeup)

- **L1 Spec-driven development**: The project started as a Kiro spec at
  `.kiro/specs/news-triage/` — `requirements.md` (7 requirements in EARS
  notation + glossary), `design.md`, `tasks.md`. Implementation followed the
  task list.
- **L2 Steering documents**: `.kiro/steering/typescript-style.md` (purity
  boundaries, no-any rule, error handling) and `project-context.md`
  (architecture map, data contract, conventions). These held throughout
  implementation — e.g. all pure logic lives in `shared/`.
- **L3 Hooks**: `.kiro/hooks/hooks.json` registers three PostFileSave hooks —
  run the PBT suite when `shared/` changes, validate the feed registry when
  `server/feeds.ts` is saved, and typecheck on `src/` saves.
- **L4 Property-based testing**: `design.md` defines 15 Correctness
  Properties; `tests/` implements 17 fast-check properties over `shared/`
  (dedupe idempotence, ordering totality, filter subset laws, tagger
  determinism/monotonicity, normalize robustness). PBT caught a real bug:
  `normalizeEntry` threw on null input.
- **L5 Powers**: `.kiro/powers/newsdeck/` — `plugin.json` with keyword triggers
  plus two skills (`project-setup`, `tagging-rules`) that load project
  conventions on demand.
- **L6 MCP**: `.kiro/settings/mcp.json` registers two servers — `newsdeck`, a
  zero-dependency stdio MCP server I wrote (`mcp-server/index.mjs`) exposing
  `latest_news`/`list_sources`/`news_stats` over the snapshot, and `fetch`
  for URL lookups.
- **L7 Custom agents**: `.kiro/agents/` — `newsdeck-dev` (implementation agent:
  full toolset, spec+steering preloaded as resources) and `news-scout`
  (read-only analyst: `read` + `@newsdeck` MCP tools only). Both verified in
  real `kiro-cli chat` sessions — news-scout answered via the newsdeck MCP
  server, newsdeck-dev ran the vitest suite through the shell tool.
- **Bonus 2 (packaged power)**: `power-newsdeck/` is a distributable power —
  `plugin.json` wires the MCP via `npx -y github:HY3YH/ai-news-triage`, so the
  same news tools work in any project straight from GitHub.
- **Bonus 1 (Kiro Web)**: a cloud session on this repository was run via
  app.kiro.dev (attach `HY3YH/ai-news-triage` in session composer).
  ← only include this line after actually doing it

## X post draft

> Built NewsDeck for the #KiroUniversity final — an AI news triage board that
> pulls 10 RSS feeds into a filterable card wall with read/star/later state.
> Every Kiro feature in the loop: spec, steering, hooks, property tests,
> powers, MCP, custom agents. #BuildWithKiro @kirodotdev
> Repo + demo: https://github.com/HY3YH/ai-news-triage

(video attached to the post — demo/demo.mp4, 57s)
