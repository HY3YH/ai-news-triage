import type { FeedSource, NewsItem, SourceError } from "../shared/types";

export interface ItemsResponse {
  fetchedAt: string;
  items: NewsItem[];
  errors: SourceError[];
  sources: FeedSource[];
}

export async function getItems(): Promise<ItemsResponse> {
  const res = await fetch("/api/items");
  if (!res.ok) throw new Error(`GET /api/items -> ${res.status}`);
  return res.json() as Promise<ItemsResponse>;
}

export async function postRefresh(): Promise<ItemsResponse> {
  const res = await fetch("/api/refresh", { method: "POST" });
  if (!res.ok) throw new Error(`POST /api/refresh -> ${res.status}`);
  return res.json() as Promise<ItemsResponse>;
}
