import { useCallback, useEffect, useMemo, useState } from "react";
import type { FilterSet, NewsItem } from "../shared/types";
import { EMPTY_FILTER } from "../shared/types";
import { applyFilters } from "../shared/filters";
import { getItems, postRefresh, type ItemsResponse } from "./api";
import { useTriageState } from "./state";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import NewsCard from "./components/NewsCard";

export default function App() {
  const [data, setData] = useState<ItemsResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterSet>(EMPTY_FILTER);
  const { triage, toggleRead, toggleStar, toggleLater, markAllRead } =
    useTriageState();

  useEffect(() => {
    getItems()
      .then(setData)
      .catch((e) => setLoadError(e instanceof Error ? e.message : String(e)));
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setData(await postRefresh());
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e));
    } finally {
      setRefreshing(false);
    }
  }, []);

  const items = useMemo(() => data?.items ?? [], [data]);
  const sources = useMemo(() => data?.sources ?? [], [data]);
  const sourceById = useMemo(
    () => new Map(sources.map((s) => [s.id, s])),
    [sources],
  );

  const visible = useMemo(
    () => applyFilters(items, filter, triage),
    [items, filter, triage],
  );

  const counts = useMemo(() => {
    const c = { all: items.length, unread: 0, read: 0, starred: 0, later: 0 };
    for (const it of items) {
      const t = triage[it.id];
      if (t?.read) c.read++;
      else c.unread++;
      if (t?.starred) c.starred++;
      if (t?.later) c.later++;
    }
    return c;
  }, [items, triage]);

  const allTags = useMemo(() => {
    const m = new Map<string, number>();
    for (const it of items)
      for (const tag of it.tags) m.set(tag, (m.get(tag) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [items]);

  const setFilterField = useCallback(
    (patch: Partial<FilterSet>) =>
      setFilter((f) => ({ ...f, ...patch })),
    [],
  );

  const visibleIds = useMemo(() => visible.map((i) => i.id), [visible]);

  return (
    <div className="app">
      <Sidebar
        sources={sources}
        items={items}
        counts={counts}
        allTags={allTags}
        filter={filter}
        onFilter={setFilterField}
      />
      <div className="main">
        <TopBar
          filter={filter}
          onFilter={setFilterField}
          onRefresh={refresh}
          refreshing={refreshing}
          fetchedAt={data?.fetchedAt ?? null}
          visibleCount={visible.length}
          totalCount={items.length}
          onMarkAllRead={() => markAllRead(visibleIds)}
        />
        {loadError && <div className="banner error">API error: {loadError}</div>}
        {data && data.errors.length > 0 && (
          <div className="banner warn">
            {data.errors.length} source(s) failed to refresh — showing cached
            items.
          </div>
        )}
        <main className="grid">
          {data === null && !loadError && (
            <div className="empty">Fetching the latest AI news…</div>
          )}
          {data !== null && visible.length === 0 && (
            <div className="empty">
              No items match. Try clearing the filters.
            </div>
          )}
          {visible.map((item: NewsItem) => (
            <NewsCard
              key={item.id}
              item={item}
              source={sourceById.get(item.sourceId)}
              entry={triage[item.id]}
              onToggleRead={toggleRead}
              onToggleStar={toggleStar}
              onToggleLater={toggleLater}
            />
          ))}
        </main>
      </div>
    </div>
  );
}
