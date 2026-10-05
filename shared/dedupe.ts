import type { NewsItem } from "./types.js";
import { normalizeTitle } from "./normalize.js";

/**
 * Remove duplicates: items sharing a canonical URL or a normalized title.
 * The first occurrence wins, so callers control priority via input order.
 * Pure and idempotent: dedupe(dedupe(xs)) === dedupe(xs).
 */
export function dedupeItems(items: NewsItem[]): NewsItem[] {
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  const out: NewsItem[] = [];
  for (const item of items) {
    const key = item.url;
    const titleKey = normalizeTitle(item.title);
    if (seenUrls.has(key) || seenTitles.has(titleKey)) continue;
    seenUrls.add(key);
    seenTitles.add(titleKey);
    out.push(item);
  }
  return out;
}

/** Sort by publishedAt descending; ties break on id for a stable total order. */
export function sortByDateDesc(items: NewsItem[]): NewsItem[] {
  return [...items].sort((a, b) => {
    const t = Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
    return t !== 0 ? t : a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}
