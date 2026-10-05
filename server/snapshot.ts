import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchAllFeeds } from "./fetch.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const snap = await fetchAllFeeds();
const out = path.join(__dirname, "data", "snapshot.json");
await mkdir(path.dirname(out), { recursive: true });
await writeFile(out, JSON.stringify(snap, null, 2));
console.log(
  `snapshot: ${snap.items.length} items, ${snap.errors.length} errors -> ${out}`,
);
for (const e of snap.errors) console.log(`  ${e.sourceId}: ${e.message}`);
