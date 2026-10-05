import { useCallback, useEffect, useState } from "react";
import type { TriageEntry, TriageState } from "../shared/types";

const STORAGE_KEY = "newsdeck.triage.v1";

function load(): TriageState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TriageState) : {};
  } catch {
    return {};
  }
}

export function useTriageState() {
  const [triage, setTriage] = useState<TriageState>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(triage));
    } catch {
      // storage full / unavailable — triage stays in memory only
    }
  }, [triage]);

  const patch = useCallback((id: string, delta: Partial<TriageEntry>) => {
    setTriage((prev) => {
      const cur = prev[id] ?? { read: false, starred: false, later: false };
      return { ...prev, [id]: { ...cur, ...delta } };
    });
  }, []);

  const toggleRead = useCallback(
    (id: string) =>
      setTriage((prev) => {
        const cur = prev[id] ?? { read: false, starred: false, later: false };
        return { ...prev, [id]: { ...cur, read: !cur.read } };
      }),
    [],
  );
  const toggleStar = useCallback(
    (id: string) =>
      setTriage((prev) => {
        const cur = prev[id] ?? { read: false, starred: false, later: false };
        return { ...prev, [id]: { ...cur, starred: !cur.starred } };
      }),
    [],
  );
  const toggleLater = useCallback(
    (id: string) =>
      setTriage((prev) => {
        const cur = prev[id] ?? { read: false, starred: false, later: false };
        return { ...prev, [id]: { ...cur, later: !cur.later } };
      }),
    [],
  );
  const markAllRead = useCallback(
    (ids: string[]) =>
      setTriage((prev) => {
        const next = { ...prev };
        for (const id of ids) {
          const cur = next[id] ?? { read: false, starred: false, later: false };
          next[id] = { ...cur, read: true };
        }
        return next;
      }),
    [],
  );

  return { triage, patch, toggleRead, toggleStar, toggleLater, markAllRead };
}
