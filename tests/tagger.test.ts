import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { applyTagRules, tagItem, DEFAULT_TAG_RULES } from "../shared/tagger";
import { normalizeEntry } from "../shared/normalize";
import type { AutoTagRule } from "../shared/types";

const arbRules: fc.Arbitrary<AutoTagRule[]> = fc.array(
  fc.record({
    tag: fc.string({ minLength: 1, maxLength: 10 }),
    keywords: fc.array(fc.string({ minLength: 1, maxLength: 8 }), { minLength: 1, maxLength: 4 }),
  }),
  { maxLength: 8 },
);

describe("applyTagRules", () => {
  it("is deterministic and returns sorted unique tags", () => {
    fc.assert(
      fc.property(fc.string(), arbRules, (text, rules) => {
        const a = applyTagRules(text, rules);
        const b = applyTagRules(text, rules);
        expect(a).toEqual(b);
        expect([...a].sort()).toEqual(a);
        expect(new Set(a).size).toBe(a.length);
      }),
    );
  });

  it("only emits tags that exist in the rules", () => {
    fc.assert(
      fc.property(fc.string(), arbRules, (text, rules) => {
        const allowed = new Set(rules.map((r) => r.tag));
        for (const t of applyTagRules(text, rules)) expect(allowed.has(t)).toBe(true);
      }),
    );
  });

  it("appending a keyword that matches never removes a tag", () => {
    fc.assert(
      fc.property(fc.string(), arbRules, fc.string({ minLength: 1, maxLength: 8 }), (text, rules, kw) => {
        const base = applyTagRules(text, rules);
        const extended = [...rules, { tag: "extra", keywords: [kw] }];
        const next = applyTagRules(`${text} ${kw}`, extended);
        for (const t of base) expect(next).toContain(t);
      }),
    );
  });
});

describe("normalizeEntry", () => {
  it("never throws on arbitrary input and produces required fields or null", () => {
    fc.assert(
      fc.property(fc.anything(), (raw) => {
        const out = normalizeEntry(raw as never, "test", []);
        if (out !== null) {
          expect(out.id).toMatch(/^[0-9a-f]{8}$/);
          expect(out.title.length).toBeGreaterThan(0);
          expect(out.url.length).toBeGreaterThan(0);
          expect(Number.isNaN(Date.parse(out.publishedAt))).toBe(false);
        }
      }),
    );
  });
});

describe("tagItem", () => {
  it("known keywords land their tag", () => {
    const item = { title: "OpenAI releases new model", summary: "", tags: [] };
    const tags = tagItem(item, DEFAULT_TAG_RULES);
    expect(tags).toContain("release");
    expect(tags).toContain("model");
  });
});
