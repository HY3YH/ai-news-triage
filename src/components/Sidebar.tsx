import type { FeedSource, FilterSet, NewsItem } from "../../shared/types";

interface Counts {
  all: number;
  unread: number;
  read: number;
  starred: number;
  later: number;
}

interface Props {
  sources: FeedSource[];
  items: NewsItem[];
  counts: Counts;
  allTags: [string, number][];
  filter: FilterSet;
  onFilter: (patch: Partial<FilterSet>) => void;
}

const VIEWS: { key: FilterSet["status"]; label: string; icon: string }[] = [
  { key: "all", label: "All items", icon: "◈" },
  { key: "unread", label: "Unread", icon: "●" },
  { key: "starred", label: "Starred", icon: "★" },
  { key: "later", label: "Read later", icon: "◷" },
  { key: "read", label: "Read", icon: "✓" },
];

export default function Sidebar({
  sources,
  items,
  counts,
  allTags,
  filter,
  onFilter,
}: Props) {
  const perSource = new Map<string, number>();
  for (const it of items)
    perSource.set(it.sourceId, (perSource.get(it.sourceId) ?? 0) + 1);

  const viewCount = (key: FilterSet["status"]) =>
    key === "all" ? counts.all : counts[key];

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">▚</span>
        <div>
          <div className="brand-name">NewsDeck</div>
          <div className="brand-sub">AI news triage</div>
        </div>
      </div>

      <nav className="nav-group">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            className={`nav-item ${filter.status === v.key ? "active" : ""}`}
            onClick={() => onFilter({ status: v.key })}
          >
            <span className="nav-icon">{v.icon}</span>
            <span className="nav-label">{v.label}</span>
            <span className="nav-count">{viewCount(v.key)}</span>
          </button>
        ))}
      </nav>

      <div className="nav-heading">Sources</div>
      <nav className="nav-group scroll">
        <button
          className={`nav-item ${filter.sourceId === null ? "active" : ""}`}
          onClick={() => onFilter({ sourceId: null })}
        >
          <span className="dot" style={{ background: "#8b94a7" }} />
          <span className="nav-label">Every source</span>
          <span className="nav-count">{items.length}</span>
        </button>
        {sources.map((s) => (
          <button
            key={s.id}
            className={`nav-item ${filter.sourceId === s.id ? "active" : ""}`}
            onClick={() =>
              onFilter({ sourceId: filter.sourceId === s.id ? null : s.id })
            }
          >
            <span className="dot" style={{ background: s.color }} />
            <span className="nav-label">{s.name}</span>
            <span className="nav-count">{perSource.get(s.id) ?? 0}</span>
          </button>
        ))}
      </nav>

      <div className="nav-heading">Tags</div>
      <div className="tag-cloud">
        {allTags.map(([tag, n]) => (
          <button
            key={tag}
            className={`tag ${filter.tag === tag ? "active" : ""}`}
            onClick={() => onFilter({ tag: filter.tag === tag ? null : tag })}
          >
            {tag}
            <span className="tag-n">{n}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
