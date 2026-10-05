import type { FilterSet, NewsItem, TriageState } from "./types.js";

/** Every status predicate. `starred`/`later` ignore the read flag. */
export function matchesStatus(
  status: FilterSet["status"],
  read: boolean,
  starred: boolean,
  later: boolean,
): boolean {
  switch (status) {
    case "all":
      return true;
    case "unread":
      return !read;
    case "read":
      return read;
    case "starred":
      return starred;
    case "later":
      return later;
  }
}

/** Does one item satisfy one filter set? Pure. */
export function matchesFilter(
  item: NewsItem,
  filter: FilterSet,
  triage: TriageState,
): boolean {
  const entry = triage[item.id] ?? { read: false, starred: false, later: false };
  if (filter.sourceId !== null && item.sourceId !== filter.sourceId) return false;
  if (filter.tag !== null && !item.tags.includes(filter.tag)) return false;
  if (!matchesStatus(filter.status, entry.read, entry.starred, entry.later)) {
    return false;
  }
  if (filter.query.trim() !== "") {
    const q = filter.query.trim().toLowerCase();
    const hay = `${item.title} ${item.summary}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

/** Apply all filters. Result is always a subset of `items`. */
export function applyFilters(
  items: NewsItem[],
  filter: FilterSet,
  triage: TriageState,
): NewsItem[] {
  return items.filter((item) => matchesFilter(item, filter, triage));
}
