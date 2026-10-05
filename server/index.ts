import express from "express";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Snapshot } from "../shared/types.js";
import { FEEDS } from "./feeds.js";
import { fetchAllFeeds } from "./fetch.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const SNAPSHOT_PATH = path.join(DATA_DIR, "snapshot.json");
const PORT = Number(process.env.PORT ?? 8787);
const STALE_MS = 30 * 60 * 1000; // re-fetch on start if older than 30 min

let snapshot: Snapshot = { fetchedAt: new Date(0).toISOString(), items: [], errors: [] };
let inflight: Promise<Snapshot> | null = null;

async function loadSnapshotFromDisk(): Promise<boolean> {
  try {
    const raw = await readFile(SNAPSHOT_PATH, "utf-8");
    snapshot = JSON.parse(raw) as Snapshot;
    return true;
  } catch {
    return false;
  }
}

/**
 * Refresh the snapshot. Concurrent callers while a refresh is in progress
 * are coalesced into the single running refresh and all await its result
 * (R1.5), rather than racing or receiving stale data.
 */
async function refresh(): Promise<Snapshot> {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const next = await fetchAllFeeds();
      if (next.items.length > 0) {
        snapshot = next;
        await mkdir(DATA_DIR, { recursive: true });
        await writeFile(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2));
      }
      return snapshot;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export function createApp() {
  const app = express();
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, refreshing: inflight !== null });
  });

  app.get("/api/items", (_req, res) => {
    res.json({ ...snapshot, sources: FEEDS });
  });

  app.post("/api/refresh", async (_req, res) => {
    const snap = await refresh();
    res.json({ ...snap, sources: FEEDS });
  });

  const distDir = path.join(__dirname, "..", "dist");
  if (existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  }

  return app;
}

export async function startServer(port = PORT) {
  await mkdir(DATA_DIR, { recursive: true });
  const hadDiskSnapshot = await loadSnapshotFromDisk();
  const stale = Date.now() - Date.parse(snapshot.fetchedAt) > STALE_MS;
  if (!hadDiskSnapshot || stale) {
    refresh().catch((err) => console.error("initial refresh failed:", err));
  }
  const app = createApp();
  return app.listen(port, () => {
    console.log(`news-triage server on http://localhost:${port}`);
  });
}

if (process.env.NODE_ENV !== "test" && process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer();
}
