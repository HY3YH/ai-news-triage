/** A configured RSS/Atom source. */
export interface FeedSource {
  id: string;
  name: string;
  url: string;
  /** Accent color used for source badges in the UI. */
  color: string;
  lang: "en" | "ja";
}

/** A normalized news item. The single shape every feed entry is coerced into. */
export interface NewsItem {
  /** Stable id derived from the canonical url. */
  id: string;
  title: string;
  url: string;
  sourceId: string;
  /** ISO-8601 timestamp. */
  publishedAt: string;
  /** Plain-text summary, HTML stripped, length-capped. */
  summary: string;
  /** Tags assigned by the auto-tagger. */
  tags: string[];
}

/** Per-item triage state kept client-side only. */
export interface TriageEntry {
  read: boolean;
  starred: boolean;
  later: boolean;
}

/** itemId -> triage entry. Missing key means unread/unstarred/not-later. */
export type TriageState = Record<string, TriageEntry>;

/** A keyword rule that assigns `tag` when any keyword matches. */
export interface AutoTagRule {
  tag: string;
  keywords: string[];
}

/** Composeable client-side filter set. Empty fields match everything. */
export interface FilterSet {
  sourceId: string | null;
  status: "all" | "unread" | "read" | "starred" | "later";
  tag: string | null;
  query: string;
}

export interface SourceError {
  sourceId: string;
  message: string;
}

/** On-disk cache written by the server so the app works when feeds are down. */
export interface Snapshot {
  fetchedAt: string;
  items: NewsItem[];
  errors: SourceError[];
}

export const EMPTY_FILTER: FilterSet = {
  sourceId: null,
  status: "all",
  tag: null,
  query: "",
};
