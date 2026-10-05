# Ask the news

With the `newsdeck` MCP server connected you can answer questions about the
latest AI news using the shared snapshot that ships with the repository.

## Tools

- `latest_news` — newest items; optional `limit` (≤100), `sourceId`, `tag`
- `list_sources` — which feeds are covered and how many items each has
- `news_stats` — totals, tag distribution, snapshot freshness

## How to use

- "What's new in AI today?" → `latest_news` with a sensible limit.
- "Anything from OpenAI?" → `latest_news` with `sourceId: "openai"`.
- "What kind of stories dominate?" → `news_stats` for the tag histogram.
- Always cite the item's `sourceId` and `url` so the user can follow up.

If a tool reports the snapshot missing, tell the user to clone the repo and
run `npm run snapshot` to refresh it.
