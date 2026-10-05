import { describe, it, expect } from "vitest";
import fc from "fast-check";
import type { NewsItem } from "../shared/types";
import { dedupeItems, sortByDateDesc } from "../shared/dedupe";
import { canonicalizeUrl, stableId, htmlToText } from "../shared/normalize";

const arbUrl = fc
  .tuple(
    fc.webAuthority(),
    fc.string({
      minLength: 1,
      maxLength: 12,
      unit: fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789"),
    }),
  )
  .map(([host, path]) => `https://${host}/${path}`);

const arbItem: fc.Arbitrary<NewsItem> = fc
  .record({
    title: fc.string({ minLength: 1, maxLength: 120 }),
    url: arbUrl,
    sourceId: fc.string({ minLength: 1, maxLength: 16 }),
    publishedAt: fc
      .integer({ min: 0, max: 2000000000000 })
      .map((ms) => new Date(ms).toISOString()),
    summary: fc.string({ maxLength: 300 }),
    tags: fc.array(fc.string({ minLength: 1, maxLength: 12 }), { maxLength: 5 }),
  })
  .map((r) => ({ ...r, id: stableId(r.url) }));

describe("dedupeItems", () => {
  it("is idempotent: dedupe(dedupe(x)) === dedupe(x)", () => {
    fc.assert(
      fc.property(fc.array(arbItem, { maxLength: 60 }), (items) => {
        const once = dedupeItems(items);
        const twice = dedupeItems(once);
        expect(twice).toEqual(once);
      }),
    );
  });

  it("output is a subset preserving first-occurrence order", () => {
    fc.assert(
      fc.property(fc.array(arbItem, { maxLength: 60 }), (items) => {
        const out = dedupeItems(items);
        const order = new Map(items.map((it, i) => [it, i]));
        for (const kept of out) expect(items).toContainEqual(kept);
        for (let i = 1; i < out.length; i++) {
          expect(order.get(out[i - 1])!).toBeLessThan(order.get(out[i])!);
        }
      }),
    );
  });

  it("never emits two items with the same canonical url", () => {
    fc.assert(
      fc.property(fc.array(arbItem, { maxLength: 60 }), (items) => {
        const out = dedupeItems(items);
        const urls = out.map((i) => i.url);
        expect(new Set(urls).size).toBe(urls.length);
      }),
    );
  });

  it("collapses items differing only in tracking params", () => {
    fc.assert(
      fc.property(arbUrl, fc.string({ minLength: 1, maxLength: 20 }), (url, tag) => {
        const a = { ...mkItem(url, "Same Title"), tags: [tag] };
        const b = mkItem(`${url}?utm_source=x`, "Same Title");
        expect(dedupeItems([a, b])).toHaveLength(1);
      }),
    );
  });
});

function mkItem(url: string, title: string): NewsItem {
  return {
    id: stableId(canonicalizeUrl(url)),
    title,
    url: canonicalizeUrl(url),
    sourceId: "s",
    publishedAt: new Date(0).toISOString(),
    summary: "",
    tags: [],
  };
}

describe("sortByDateDesc", () => {
  it("output is a permutation of input, sorted desc, stable on ties", () => {
    fc.assert(
      fc.property(fc.array(arbItem, { maxLength: 60 }), (items) => {
        const sorted = sortByDateDesc(items);
        expect(sorted.length).toBe(items.length);
        for (let i = 1; i < sorted.length; i++) {
          const prev = Date.parse(sorted[i - 1].publishedAt);
          const cur = Date.parse(sorted[i].publishedAt);
          expect(prev).toBeGreaterThanOrEqual(cur);
          if (prev === cur) {
            expect(sorted[i - 1].id <= sorted[i].id).toBe(true);
          }
        }
      }),
    );
  });
});

describe("canonicalizeUrl", () => {
  it("is idempotent and strips tracking noise", () => {
    fc.assert(
      fc.property(arbUrl, (url) => {
        const once = canonicalizeUrl(`${url}?utm_source=a&utm_medium=b`);
        expect(once).toBe(canonicalizeUrl(once));
        expect(once).not.toContain("utm_");
      }),
    );
  });
});

describe("htmlToText", () => {
  it("never throws and never emits '<' from tags", () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        const out = htmlToText(`<div>${s}</div>`);
        expect(typeof out).toBe("string");
        expect(out).not.toContain("<div>");
      }),
    );
  });
});
