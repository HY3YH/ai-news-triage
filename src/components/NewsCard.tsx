import type { FeedSource, NewsItem, TriageEntry } from "../../shared/types";

interface Props {
  item: NewsItem;
  source?: FeedSource;
  entry?: TriageEntry;
  onToggleRead: (id: string) => void;
  onToggleStar: (id: string) => void;
  onToggleLater: (id: string) => void;
}

function relTime(iso: string): string {
  const s = Math.max(0, (Date.now() - Date.parse(iso)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  const d = Math.floor(s / 86400);
  return d === 1 ? "1 day ago" : `${d} days ago`;
}

export default function NewsCard({
  item,
  source,
  entry,
  onToggleRead,
  onToggleStar,
  onToggleLater,
}: Props) {
  const read = entry?.read ?? false;
  const starred = entry?.starred ?? false;
  const later = entry?.later ?? false;
  const color = source?.color ?? "#8b94a7";

  return (
    <article
      className={`card ${read ? "read" : ""}`}
      style={{ ["--accent" as string]: color }}
    >
      <div className="card-top">
        <span className="badge">
          <span className="dot" style={{ background: color }} />
          {source?.name ?? item.sourceId}
        </span>
        <span className="time">{relTime(item.publishedAt)}</span>
      </div>
      <a
        className="card-title"
        href={item.url}
        target="_blank"
        rel="noreferrer"
        onClick={() => !read && onToggleRead(item.id)}
      >
        {item.title}
      </a>
      {item.summary && <p className="card-summary">{item.summary}</p>}
      {item.tags.length > 0 && (
        <div className="card-tags">
          {item.tags.map((t) => (
            <span key={t} className="tag small">
              {t}
            </span>
          ))}
        </div>
      )}
      <div className="card-actions">
        <button
          className={`action ${read ? "on" : ""}`}
          title={read ? "Mark as unread" : "Mark as read"}
          onClick={() => onToggleRead(item.id)}
        >
          {read ? "✓ read" : "mark read"}
        </button>
        <button
          className={`action ${starred ? "on star" : ""}`}
          title="Star"
          onClick={() => onToggleStar(item.id)}
        >
          {starred ? "★ starred" : "☆ star"}
        </button>
        <button
          className={`action ${later ? "on later" : ""}`}
          title="Read later"
          onClick={() => onToggleLater(item.id)}
        >
          {later ? "◷ queued" : "◷ later"}
        </button>
      </div>
    </article>
  );
}
