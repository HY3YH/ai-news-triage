#!/usr/bin/env node
/**
 * NewsDeck MCP server — zero-dependency, stdio transport.
 * Exposes the news snapshot written by server/snapshot.ts to any
 * MCP client (Kiro, Claude Code, ...).
 *
 * Protocol: newline-delimited JSON-RPC 2.0 per MCP stdio transport.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SNAPSHOT = path.join(__dirname, "..", "server", "data", "snapshot.json");

const SERVER_INFO = { name: "newsdeck-mcp", version: "1.0.0" };
const PROTOCOL_VERSION = "2025-06-18";

const TOOLS = [
  {
    name: "list_sources",
    description: "List the RSS sources NewsDeck fetches, with per-source item counts.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "latest_news",
    description:
      "Get the latest AI news items from the local snapshot. Filter by source or tag.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max items to return (default 10)" },
        sourceId: { type: "string", description: "Filter by source id, e.g. 'openai'" },
        tag: { type: "string", description: "Filter by auto-tag, e.g. 'release'" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "news_stats",
    description: "Snapshot stats: total items, per-source and per-tag counts, freshness.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
];

async function loadSnapshot() {
  const raw = await readFile(SNAPSHOT, "utf-8");
  return JSON.parse(raw);
}

function textResult(text) {
  return { content: [{ type: "text", text }] };
}

async function callTool(name, args = {}) {
  const snap = await loadSnapshot();
  const items = snap.items ?? [];
  switch (name) {
    case "list_sources": {
      const counts = new Map();
      for (const it of items) counts.set(it.sourceId, (counts.get(it.sourceId) ?? 0) + 1);
      const lines = [...counts.entries()]
        .sort()
        .map(([id, n]) => `${id}: ${n} items`);
      return textResult(lines.join("\n") || "no items in snapshot");
    }
    case "latest_news": {
      const limit = Math.min(Math.max(1, args.limit ?? 10), 100);
      let out = items;
      if (args.sourceId) out = out.filter((i) => i.sourceId === args.sourceId);
      if (args.tag) out = out.filter((i) => i.tags.includes(args.tag));
      return textResult(
        out
          .slice(0, limit)
          .map((i) => `- [${i.sourceId}] ${i.title}\n  ${i.url}\n  ${i.publishedAt}`)
          .join("\n") || "no matching items",
      );
    }
    case "news_stats": {
      const byTag = new Map();
      for (const it of items)
        for (const t of it.tags) byTag.set(t, (byTag.get(t) ?? 0) + 1);
      return textResult(
        JSON.stringify(
          {
            fetchedAt: snap.fetchedAt,
            totalItems: items.length,
            feedErrors: (snap.errors ?? []).length,
            tags: Object.fromEntries([...byTag.entries()].sort((a, b) => b[1] - a[1])),
          },
          null,
          2,
        ),
      );
    }
    default:
      return { content: [{ type: "text", text: `unknown tool: ${name}` }], isError: true };
  }
}

function send(msg) {
  process.stdout.write(JSON.stringify(msg) + "\n");
}

let buffer = "";
process.stdin.setEncoding("utf-8");
process.stdin.on("data", async (chunk) => {
  buffer += chunk;
  let idx;
  while ((idx = buffer.indexOf("\n")) >= 0) {
    const line = buffer.slice(0, idx).trim();
    buffer = buffer.slice(idx + 1);
    if (!line) continue;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      continue;
    }
    if (msg.id === undefined) continue; // notification — no reply
    const reply = { jsonrpc: "2.0", id: msg.id };
    try {
      switch (msg.method) {
        case "initialize":
          reply.result = {
            protocolVersion: PROTOCOL_VERSION,
            capabilities: { tools: { listChanged: false } },
            serverInfo: SERVER_INFO,
          };
          break;
        case "ping":
          reply.result = {};
          break;
        case "tools/list":
          reply.result = { tools: TOOLS };
          break;
        case "tools/call":
          reply.result = await callTool(msg.params?.name, msg.params?.arguments);
          break;
        default:
          reply.error = { code: -32601, message: `method not found: ${msg.method}` };
      }
    } catch (e) {
      reply.error = { code: -32603, message: e instanceof Error ? e.message : String(e) };
    }
    send(reply);
  }
});
process.stdin.resume();
