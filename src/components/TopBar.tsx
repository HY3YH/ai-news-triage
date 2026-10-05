import type { FilterSet } from "../../shared/types";

interface Props {
  filter: FilterSet;
  onFilter: (patch: Partial<FilterSet>) => void;
  onRefresh: () => void;
  refreshing: boolean;
  fetchedAt: string | null;
  visibleCount: number;
  totalCount: number;
  onMarkAllRead: () => void;
}

function relTime(iso: string | null): string {
  if (!iso) return "never";
  const s = Math.max(0, (Date.now() - Date.parse(iso)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function TopBar({
  filter,
  onFilter,
  onRefresh,
  refreshing,
  fetchedAt,
  visibleCount,
  totalCount,
  onMarkAllRead,
}: Props) {
  return (
    <header className="topbar">
      <div className="search-wrap">
        <span className="search-icon">⌕</span>
        <input
          className="search"
          placeholder="Search titles & summaries…"
          value={filter.query}
          onChange={(e) => onFilter({ query: e.target.value })}
        />
      </div>
      <div className="topbar-meta">
        <span className="muted">
          {visibleCount} / {totalCount} items · updated {relTime(fetchedAt)}
        </span>
        <button className="btn ghost" onClick={onMarkAllRead}>
          Mark shown as read
        </button>
        <button className="btn primary" onClick={onRefresh} disabled={refreshing}>
          {refreshing ? "Refreshing…" : "↻ Refresh"}
        </button>
      </div>
    </header>
  );
}
