# Requirements Document — NewsDeck (AI News Triage)

## Introduction

NewsDeck is a single-user web application for triaging AI news. A Node/Express
server fetches a curated set of public RSS/Atom feeds, normalizes items into a
shared shape, deduplicates them, applies keyword auto-tags, and caches the
result to a disk snapshot. A React SPA renders the items as a filterable card
board. Triage state (read / starred / read-later) persists in the browser.

## Glossary

- **Item**: a normalized news entry — `{id, title, url, sourceId, publishedAt,
  summary, tags}`. `id` is `stableId(canonicalizeUrl(url))`.
- **Source**: a configured RSS/Atom feed with `{id, name, url, color, lang}`.
- **TriageState**: client-side map `itemId -> {read, starred, later}` stored in
  localStorage. The server never receives it.
- **AutoTagRule**: `{tag, keywords[]}` — assigns `tag` when any keyword
  case-insensitively matches title+summary text.
- **Snapshot**: `{fetchedAt, items, errors}` persisted at
  `server/data/snapshot.json`.

## Requirements

### Requirement 1 — Feed fetching

**User Story:** As a reader, I want the server to fetch all configured feeds
concurrently, so the board shows fresh news without waiting on any single
slow feed.

#### Acceptance Criteria

1. WHEN a refresh runs THEN the system SHALL request every Source in
   `server/feeds.ts` concurrently with a per-feed timeout of 12 seconds.
2. WHEN a Source request fails or times out THEN the system SHALL record a
   SourceError for that source and continue processing the remaining feeds.
3. WHEN zero items are produced by a refresh THEN the system SHALL keep the
   previous Snapshot rather than overwriting it with empty data.
4. WHEN a refresh succeeds THEN the system SHALL write the new Snapshot to
   `server/data/snapshot.json` before answering the request.
5. WHILE a refresh is in progress THEN the system SHALL coalesce additional
   refresh requests into the running one.

### Requirement 2 — Normalization

**User Story:** As a reader, I want items from ten different feed formats to
look identical, so I can compare them on one board.

#### Acceptance Criteria

1. WHEN a raw feed entry has no link and no guid, or no usable title THEN the
   system SHALL skip it.
2. WHEN a raw feed entry is normalized THEN the system SHALL canonicalize its
   URL (lowercase host, strip `utm_*`/`fbclid`/`gclid`/etc. tracking params,
   strip fragments) and derive `id` as `stableId(canonicalUrl)`.
3. WHEN a summary is produced THEN the system SHALL strip HTML markup and
   cap it at 240 characters on a word boundary.
4. IF a publish date is missing or unparsable THEN the system SHALL use the
   epoch (`1970-01-01T00:00:00.000Z`) rather than rejecting the item.
5. WHEN normalization receives non-object input THEN the system SHALL return
   null instead of throwing.

### Requirement 3 — Deduplication and ordering

**User Story:** As a reader, I want syndicated duplicates collapsed, so each
story appears once.

#### Acceptance Criteria

1. WHEN two items share a canonical URL or a normalized title THEN the
   system SHALL keep only the first occurrence.
2. WHEN dedupe runs twice on the same input THEN the system SHALL produce
   identical output (idempotent).
3. WHEN items are listed THEN the system SHALL order them by `publishedAt`
   descending, breaking ties on `id` for a stable total order.

### Requirement 4 — Auto-tagging

**User Story:** As a reader, I want items pre-tagged by topic, so I can scan
one theme at a time.

#### Acceptance Criteria

1. WHEN an item is ingested THEN the system SHALL apply every AutoTagRule to
   its title+summary text and merge matches with any feed-provided tags.
2. WHEN tag rules run THEN the system SHALL produce a sorted, duplicate-free
   tag list deterministically.
3. WHERE a Source's language is Japanese THEN AutoTagRules SHALL still match
   via included Japanese keywords.

### Requirement 5 — Filtering

**User Story:** As a reader, I want to combine source, status, tag, and text
filters, so I can isolate exactly the items I mean to read.

#### Acceptance Criteria

1. WHEN multiple filters are set THEN the system SHALL apply them
   conjunctively (AND).
2. WHEN the status filter is "unread"/"read"/"starred"/"later" THEN the
   system SHALL match items purely on the corresponding TriageState flag.
3. WHEN the search query is non-empty THEN the system SHALL match it
   case-insensitively against title and summary.
4. WHEN all filters are cleared THEN the system SHALL return every item in
   input order.
5. WHILE filtering THEN the system SHALL run entirely client-side with no
   network requests.

### Requirement 6 — Triage actions

**User Story:** As a reader, I want to mark read, star, and snooze items so
the board remembers what I have processed.

#### Acceptance Criteria

1. WHEN the user toggles read/starred/later on an item THEN the system SHALL
   persist the change to localStorage immediately.
2. WHEN the app reloads THEN the system SHALL restore TriageState from
   localStorage.
3. WHEN the user clicks a card title THEN the system SHALL open the article
   in a new tab and mark the item read.
4. WHEN "mark shown as read" is clicked THEN the system SHALL set `read` on
   every currently-visible item without touching other flags.

### Requirement 7 — Resilience

**User Story:** As a reader, I want the app to work during a demo even if the
network dies, so nothing hangs.

#### Acceptance Criteria

1. WHEN the server starts THEN the system SHALL load the existing Snapshot
   from disk before accepting requests.
2. IF the on-disk Snapshot is older than 30 minutes at startup THEN the
   system SHALL trigger a background refresh without blocking startup.
3. WHEN feed errors exist THEN the UI SHALL show a non-blocking warning
   banner and continue rendering items.

## Out of scope

- Multi-user accounts, server-side state, authentication.
- Full-text article scraping or AI summarization of items.
