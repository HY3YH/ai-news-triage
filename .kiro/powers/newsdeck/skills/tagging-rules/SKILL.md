# Tagging rules

Auto-tags come from `DEFAULT_TAG_RULES` in `shared/tagger.ts`.

## Current tags

`release`, `research`, `model`, `tutorial`, `business`, `policy`, `tool`

## How to add or tune a tag

1. Add `{ tag, keywords: [...] }` to `DEFAULT_TAG_RULES` — keywords are matched
   case-insensitively against `title + summary`, so write them lowercase.
2. For Japanese feeds (zenn), include Japanese keywords in the same rule.
3. Keep tags short nouns; the tag cloud renders raw tag strings.
4. A tag only appears when at least one keyword matches — overly broad
   keywords ("ai", "the") pollute the board, avoid them.
5. Property tests enforce sorted-unique output; `tagItem` merges auto-tags
   with feed-provided tags.
