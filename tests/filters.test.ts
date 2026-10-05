import { describe, it, expect } from "vitest";
import fc from "fast-check";
import type { FilterSet, NewsItem, TriageEntry } from "../shared/types";
import { applyFilters, matchesStatus } from "../shared/filters";
import { stableId } from "../shared/normalize";

const arbItem: fc.Arbitrary<NewsItem> = fc
  .record({
    title: fc.string({ minLength: 0, maxLength: 80 }),
    url: fc.webUrl(),
    sourceId: fc.constantFrom("a", "b", "c"),
    publishedAt: fc.integer({ min: 0, max: 2000000000000 }).map((ms) => new Date(ms).toISOString()),
    summary: fc.string({ maxLength: 120 }),
    tags: fc.array(fc.constantFrom("release", "model", "tool"), { maxLength: 3 }),
  })
  .map((r) => ({ ...r, id: stableId(r.url) }));

const arbTriage = fc.dictionary(
  fc.integer({ min: 0, max: 0xffffffff }).map((i) => i.toString(16).padStart(8, "0")),
  fc.record({
    read: fc.boolean(),
    starred: fc.boolean(),
    later: fc.boolean(),
  }) as fc.Arbitrary<TriageEntry>,
);

const arbFilter: fc.Arbitrary<FilterSet> = fc.record({
  sourceId: fc.constantFrom(null, "a", "b", "c"),
  status: fc.constantFrom("all", "unread", "read", "starred", "later"),
  tag: fc.constantFrom(null, "release", "model", "tool", "nope"),
  query: fc.string({ maxLength: 10 }),
}) as fc.Arbitrary<FilterSet>;

describe("applyFilters", () => {
  it("result is always a subset of the input", () => {
    fc.assert(
      fc.property(
        fc.array(arbItem, { maxLength: 50 }),
        arbTriage,
        arbFilter,
        (items, triage, filter) => {
          const out = applyFilters(items, filter, triage);
          expect(out.length).toBeLessThanOrEqual(items.length);
          for (const it of out) expect(items).toContainEqual(it);
        },
      ),
    );
  });

  it("filters commute: status then source == source then status", () => {
    fc.assert(
      fc.property(
        fc.array(arbItem, { maxLength: 50 }),
        arbTriage,
        arbFilter,
        (items, triage, filter) => {
          const a = applyFilters(items, filter, triage);
          const b = applyFilters(
            applyFilters(items, { ...filter, query: "", tag: null }, triage),
            { sourceId: null, status: "all", tag: filter.tag, query: filter.query },
            triage,
          );
          expect(new Set(a.map((i) => i.id))).toEqual(new Set(b.map((i) => i.id)));
        },
      ),
    );
  });

  it("'all' with no source/tag/query returns every item", () => {
    fc.assert(
      fc.property(fc.array(arbItem, { maxLength: 50 }), (items) => {
        const out = applyFilters(
          items,
          { sourceId: null, status: "all", tag: null, query: "" },
          {},
        );
        expect(out).toEqual(items);
      }),
    );
  });

  it("search is case-insensitive", () => {
    fc.assert(
      fc.property(fc.array(arbItem, { maxLength: 50 }), (items) => {
        const f = (q: string) =>
          applyFilters(
            items,
            { sourceId: null, status: "all", tag: null, query: q },
            {},
          );
        const upper = f("AI");
        const lower = f("ai");
        expect(new Set(upper.map((i) => i.id))).toEqual(new Set(lower.map((i) => i.id)));
      }),
    );
  });
});

describe("matchesStatus", () => {
  it("unread and read are complementary", () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.boolean(),
        fc.boolean(),
        (read, starred, later) => {
          expect(matchesStatus("unread", read, starred, later)).toBe(!read);
          expect(matchesStatus("read", read, starred, later)).toBe(read);
          expect(matchesStatus("starred", read, starred, later)).toBe(starred);
          expect(matchesStatus("later", read, starred, later)).toBe(later);
          expect(matchesStatus("all", read, starred, later)).toBe(true);
        },
      ),
    );
  });
});
