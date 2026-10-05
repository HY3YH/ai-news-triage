import Parser from "rss-parser";
import type { FeedSource, NewsItem, SourceError, Snapshot } from "../shared/types.js";
import { normalizeEntry, type RawEntry } from "../shared/normalize.js";
import { dedupeItems, sortByDateDesc } from "../shared/dedupe.js";
import { tagItem, DEFAULT_TAG_RULES } from "../shared/tagger.js";
import { FEEDS } from "./feeds.js";

const parser = new Parser({ timeout: 12_000 });

const MAX_ITEMS_PER_FEED = 25;

async function fetchSource(source: FeedSource): Promise<NewsItem[]> {
  const feed = await parser.parseURL(source.url);
  const items: NewsItem[] = [];
  for (const raw of feed.items.slice(0, MAX_ITEMS_PER_FEED)) {
    const item = normalizeEntry(raw as RawEntry, source.id, []);
    if (item) {
      items.push({ ...item, tags: tagItem(item, DEFAULT_TAG_RULES) });
    }
  }
  return items;
}

/**
 * Fetch every feed concurrently with a per-feed timeout. A failing feed
 * never blocks the others — it becomes a SourceError instead.
 */
export async function fetchAllFeeds(
  feeds: FeedSource[] = FEEDS,
): Promise<Snapshot> {
  const results = await Promise.allSettled(feeds.map(fetchSource));
  const items: NewsItem[] = [];
  const errors: SourceError[] = [];
  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      items.push(...result.value);
    } else {
      errors.push({
        sourceId: feeds[i].id,
        message:
          result.reason instanceof Error
            ? result.reason.message
            : String(result.reason),
      });
    }
  });
  return {
    fetchedAt: new Date().toISOString(),
    items: sortByDateDesc(dedupeItems(items)),
    errors,
  };
}
