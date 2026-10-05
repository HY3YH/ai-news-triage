import type { FeedSource } from "../shared/types.js";

export const FEEDS: FeedSource[] = [
  { id: "openai", name: "OpenAI", url: "https://openai.com/news/rss.xml", color: "#10a37f", lang: "en" },
  { id: "huggingface", name: "Hugging Face", url: "https://huggingface.co/blog/feed.xml", color: "#ff9d00", lang: "en" },
  { id: "google-ai", name: "Google AI", url: "https://blog.google/technology/ai/rss/", color: "#4285f4", lang: "en" },
  { id: "deepmind", name: "DeepMind", url: "https://deepmind.google/blog/rss.xml", color: "#668cff", lang: "en" },
  { id: "techcrunch", name: "TechCrunch AI", url: "https://techcrunch.com/category/artificial-intelligence/feed/", color: "#0a9e01", lang: "en" },
  { id: "verge", name: "The Verge AI", url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml", color: "#e5127e", lang: "en" },
  { id: "mit", name: "MIT Tech Review", url: "https://www.technologyreview.com/topic/artificial-intelligence/feed", color: "#a31f34", lang: "en" },
  { id: "arxiv", name: "arXiv cs.AI", url: "https://export.arxiv.org/rss/cs.AI", color: "#b31b1b", lang: "en" },
  { id: "zenn", name: "Zenn AI", url: "https://zenn.dev/topics/ai/feed", color: "#3ea8ff", lang: "ja" },
  { id: "kdnuggets", name: "KDnuggets", url: "https://www.kdnuggets.com/feed", color: "#7c4dff", lang: "en" },
];
