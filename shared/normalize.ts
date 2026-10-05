import type { NewsItem } from "./types.js";

const TRACKING_PARAMS = /^(utm_|fbclid|gclid|ref_|spm|igshid|mc_cid|mc_eid)/i;

/**
 * Reduce a URL to its canonical form: lowercase host, no tracking query
 * params, no hash fragment, no trailing slash on the path. Two items that
 * differ only in tracking noise canonicalize to the same URL.
 */
export function canonicalizeUrl(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return raw.trim();
  }
  url.hostname = url.hostname.toLowerCase();
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    if (TRACKING_PARAMS.test(key)) url.searchParams.delete(key);
  }
  const out = url.toString();
  return out.endsWith("/") && url.pathname === "/" ? out.slice(0, -1) : out;
}

/** FNV-1a 32-bit hash, hex encoded. Stable across runs and machines. */
export function stableId(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/** Strip tags, decode the common entities, collapse whitespace. */
export function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Normalize a title for dedupe comparison: lowercase, no punctuation/space. */
export function normalizeTitle(title: string): string {
  return htmlToText(title)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

/** Cap `text` at `max` chars on a word boundary, adding an ellipsis. */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return (space > max * 0.6 ? cut.slice(0, space) : cut).trimEnd() + "…";
}

export interface RawEntry {
  title?: string;
  link?: string;
  isoDate?: string;
  pubDate?: string;
  contentSnippet?: string;
  content?: string;
  guid?: string;
}

/** Coerce one raw feed entry into a NewsItem, or null if unusable. */
export function normalizeEntry(
  raw: RawEntry,
  sourceId: string,
  tags: string[],
): NewsItem | null {
  if (typeof raw !== "object" || raw === null) return null;
  const link = String(raw.link ?? raw.guid ?? "").trim();
  const title = htmlToText(String(raw.title ?? "")).trim();
  if (!link || !title) return null;
  const url = canonicalizeUrl(link);
  const date = raw.isoDate ?? raw.pubDate;
  const publishedAt =
    date && !Number.isNaN(Date.parse(date))
      ? new Date(date).toISOString()
      : new Date(0).toISOString();
  return {
    id: stableId(url),
    title,
    url,
    sourceId,
    publishedAt,
    summary: truncate(htmlToText(raw.contentSnippet ?? raw.content ?? ""), 240),
    tags,
  };
}
