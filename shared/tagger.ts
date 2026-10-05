import type { AutoTagRule, NewsItem } from "./types.js";
import { htmlToText } from "./normalize.js";

/** Default rules. Order matters only for display; output is sorted+unique. */
export const DEFAULT_TAG_RULES: AutoTagRule[] = [
  {
    tag: "release",
    keywords: [
      "release", "launch", "announce", "introducing", "now available",
      "generally available", "リリース", "公開", "発表",
    ],
  },
  {
    tag: "research",
    keywords: [
      "paper", "research", "study", "arxiv", "benchmark", "we propose",
      "論文", "研究", "実験",
    ],
  },
  {
    tag: "model",
    keywords: [
      "gpt", "claude", "gemini", "llama", "model", "llm", "diffusion",
      "transformer", "モデル",
    ],
  },
  {
    tag: "tutorial",
    keywords: [
      "how to", "guide", "tutorial", "walkthrough", "tips", "使い方",
      "入門", "やってみた", "解説",
    ],
  },
  {
    tag: "business",
    keywords: [
      "funding", "acquisition", "raises", "revenue", "ipo", "partnership",
      "investment", "billion", "million", "資金", "買収", "提携",
    ],
  },
  {
    tag: "policy",
    keywords: [
      "regulation", "policy", "law", "copyright", "lawsuit", "safety",
      "antitrust", "規制", "著作権", "訴訟",
    ],
  },
  {
    tag: "tool",
    keywords: [
      "api", "sdk", "cli", "plugin", "extension", "agent", "mcp",
      "framework", "library", "ツール",
    ],
  },
];

/**
 * Apply keyword rules to a piece of text. Pure and deterministic:
 * same text + same rules -> same sorted tag list, every time.
 */
export function applyTagRules(text: string, rules: AutoTagRule[]): string[] {
  const haystack = htmlToText(text).toLowerCase();
  const tags = new Set<string>();
  for (const rule of rules) {
    for (const kw of rule.keywords) {
      if (kw && haystack.includes(kw.toLowerCase())) {
        tags.add(rule.tag);
        break;
      }
    }
  }
  return [...tags].sort();
}

/** Tag an item from its title + summary. Never mutates the input. */
export function tagItem(
  item: Pick<NewsItem, "title" | "summary" | "tags">,
  rules: AutoTagRule[] = DEFAULT_TAG_RULES,
): string[] {
  const auto = applyTagRules(`${item.title} ${item.summary}`, rules);
  return [...new Set([...item.tags, ...auto])].sort();
}
