import { describe, it, expect, vi } from "vitest";
import type { AddressInfo } from "node:net";
import type { Snapshot } from "../shared/types.js";

vi.mock("../server/fetch.js", () => ({
  fetchAllFeeds: vi.fn(),
}));

import { createApp } from "../server/index.js";
import { fetchAllFeeds } from "../server/fetch.js";

const mockedFetch = vi.mocked(fetchAllFeeds);

function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("POST /api/refresh coalescing (R1.5)", () => {
  it("concurrent refreshes share one in-flight fetch", async () => {
    const d = deferred<Snapshot>();
    mockedFetch.mockReturnValue(d.promise);

    const server = createApp().listen(0);
    const port = (server.address() as AddressInfo).port;
    const call = () =>
      fetch(`http://127.0.0.1:${port}/api/refresh`, { method: "POST" }).then(
        (r) => r.json() as Promise<Snapshot>,
      );

    try {
      const p1 = call();
      const p2 = call();
      // let both handlers reach refresh() before the fetch resolves
      await new Promise((r) => setTimeout(r, 20));
      d.resolve({ fetchedAt: new Date().toISOString(), items: [], errors: [] });
      const [a, b] = await Promise.all([p1, p2]);
      expect(mockedFetch).toHaveBeenCalledTimes(1);
      expect(a.fetchedAt).toBe(b.fetchedAt);
    } finally {
      server.close();
    }
  });
});
