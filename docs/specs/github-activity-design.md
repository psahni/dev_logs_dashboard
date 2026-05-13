# Technical Design — GitHub Activity on Dashboard

**Feature slug:** `github-activity`  
**Spec:** [github-activity-spec.md](./github-activity-spec.md)  
**Approach:** Backend cache in SQLite (SQLAlchemy + Alembic), force-refresh via `?refresh=true`

---

## 1. Data Model

### New table: `github_cache`

One row per cached item (commit or PR). Storing individual rows (not a single JSON blob)
keeps the table queryable for future features (standup generator, weekly digest).

```python
# backend/app/models/github.py
from datetime import datetime, timezone
from sqlalchemy import Index
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class GitHubCacheItem(Base):
    __tablename__ = "github_cache"

    id:          Mapped[int]      = mapped_column(primary_key=True, autoincrement=True)
    type:        Mapped[str]      = mapped_column(nullable=False)        # "commit" | "pull_request"
    external_id: Mapped[str]      = mapped_column(nullable=False)        # sha or PR number (str)
    repo:        Mapped[str]      = mapped_column(nullable=False)        # "owner/repo"
    title:       Mapped[str]      = mapped_column(nullable=False)        # commit message or PR title
    url:         Mapped[str]      = mapped_column(nullable=False)        # GitHub HTML URL
    state:       Mapped[str|None] = mapped_column(nullable=True)         # None for commits; "open"|"merged" for PRs
    date:        Mapped[datetime] = mapped_column(nullable=False)        # commit date or PR created_at
    fetched_at:  Mapped[datetime] = mapped_column(
                     nullable=False,
                     default=lambda: datetime.now(timezone.utc)
                 )

    __table_args__ = (
        Index("github_cache_type_fetched_idx", "type", "fetched_at"),
    )
```

**TTL logic:** On each request, check if any row with the matching `type` has
`fetched_at >= now - 15 min`. If yes → return cached rows. If no (or `refresh=True`)
→ delete all rows of that type, re-fetch from GitHub, insert fresh rows.

---

## 2. API Contracts

### `GET /github/commits`

Fetches commits authored by `GITHUB_USERNAME` in the last 7 days.

| | |
|---|---|
| Query params | `refresh: bool = False` |
| Auth | `GITHUB_TOKEN` env var (bearer token to GitHub API) |

**Response 200** — `list[GitHubCommitRead]`
```python
class GitHubCommitRead(BaseModel):
    sha:     str
    message: str       # first line only
    repo:    str       # "owner/repo"
    url:     str       # HTML URL to commit
    date:    datetime
```

**Error cases**
| Status | Condition |
|--------|-----------|
| 401 | `GITHUB_TOKEN` missing or rejected by GitHub |
| 502 | GitHub API unreachable or returned unexpected error |

---

### `GET /github/pulls`

Fetches PRs opened or merged by `GITHUB_USERNAME` in the last 7 days.

| | |
|---|---|
| Query params | `refresh: bool = False` |
| Auth | `GITHUB_TOKEN` env var |

**Response 200** — `list[GitHubPRRead]`
```python
class GitHubPRRead(BaseModel):
    number: int
    title:  str
    repo:   str        # "owner/repo"
    url:    str        # HTML URL to PR
    state:  str        # "open" | "merged"
    date:   datetime   # created_at
```

**Error cases** — same as commits (401, 502)

---

### GitHub API calls made by the backend

| Resource | GitHub endpoint |
|----------|----------------|
| Commits | `GET https://api.github.com/search/commits?q=author:{username}+committer-date:>={since}` |
| PRs | `GET https://api.github.com/search/issues?q=type:pr+author:{username}+created:>={since}` |

Both require header `Accept: application/vnd.github+json` and
`Authorization: Bearer {GITHUB_TOKEN}`. `since` = ISO date 7 days ago.

---

## 3. Frontend Components

### New types — `frontend/src/lib/types.ts`

Add two types mirroring the backend response schemas:

```typescript
export type GitHubCommit = {
  sha: string;
  message: string;
  repo: string;
  url: string;
  date: string;
};

export type GitHubPR = {
  number: number;
  title: string;
  repo: string;
  url: string;
  state: "open" | "merged";
  date: string;
};
```

### New fetch helpers — `frontend/src/lib/api.ts`

```typescript
export async function getCommits(refresh = false): Promise<GitHubCommit[]>
export async function getPulls(refresh = false): Promise<GitHubPR[]>
```

Both call the respective `/github/*` endpoints; append `?refresh=true` when
`refresh` is `true`.

### New component — `GitHubActivityWidget`

| Property | Value |
|----------|-------|
| File | `frontend/src/components/features/GitHubActivityWidget.tsx` |
| Type | **Client Component** (`"use client"`) |
| Props | `{ initialCommits: GitHubCommit[], initialPulls: GitHubPR[] }` |

Owns `commits`, `pulls`, `loading`, and `error` state (all initialised from props).
Renders:
- A widget header ("GitHub Activity — last 7 days") with a **Refresh** button
- A loading spinner while refreshing
- A non-blocking error banner if the API fails
- A combined list of commits and PRs sorted by date descending; each item shows
  an icon (commit vs PR), title/message, repo badge, date, and a link to GitHub
- Empty-state message when both lists are empty

**Refresh button behaviour:** calls `getCommits(true)` and `getPulls(true)` in
parallel, sets loading state, updates `commits`/`pulls` state on success,
sets error state on failure.

### Modified component — `LogDashboard`

| File | `frontend/src/components/features/LogDashboard.tsx` |
|------|------|
| Change | Add `initialCommits: GitHubCommit[]` and `initialPulls: GitHubPR[]` props; render `<GitHubActivityWidget>` alongside `<LogList>` |

### Modified page — `frontend/src/app/page.tsx`

Fetch all three data sources in parallel at request time:

```typescript
const [logs, commits, pulls] = await Promise.all([
  getLogs(),
  getCommits().catch(() => []),   // graceful degradation
  getPulls().catch(() => []),
]);
```

Pass `commits` and `pulls` to `<LogDashboard>`.

---

## 4. MCP Tools

Add two tools to `mcp-server/server.py`:

### `get_github_commits`
```
Tool name:   get_github_commits
Description: Fetch GitHub commits authored by the configured user in the last 7 days.
Parameters:  refresh (bool, default False) — pass True to bypass cache
Calls:       GET http://localhost:8000/github/commits[?refresh=true]
```

### `get_github_pulls`
```
Tool name:   get_github_pulls
Description: Fetch GitHub pull requests opened or merged by the configured user in the last 7 days.
Parameters:  refresh (bool, default False) — pass True to bypass cache
Calls:       GET http://localhost:8000/github/pulls[?refresh=true]
```

---

## 5. Integration Points

```
page.tsx (Server Component)
  └─ Promise.all([getLogs(), getCommits(), getPulls()])
       ├─ GET /logs         → LogDashboard → LogList
       ├─ GET /github/commits → LogDashboard → GitHubActivityWidget
       └─ GET /github/pulls   → LogDashboard → GitHubActivityWidget

GitHubActivityWidget "Refresh" button (Client Component)
  └─ getCommits(true) + getPulls(true) in parallel
       ├─ GET /github/commits?refresh=true
       └─ GET /github/pulls?refresh=true

FastAPI /github/commits (or /github/pulls)
  ├─ Cache hit  → return rows from github_cache (SQLAlchemy)
  └─ Cache miss → httpx GET GitHub Search API
                  → delete old rows, insert fresh rows
                  → return new rows

MCP claude prompt: "show my github commits"
  └─ get_github_commits() → GET /github/commits
```

---

## 6. Migration Plan

One new Alembic migration: **create `github_cache` table**.

```bash
cd backend
uv run alembic revision --autogenerate -m "create github_cache table"
uv run alembic upgrade head
```

The migration creates:
- Table `github_cache` with columns: `id`, `type`, `external_id`, `repo`, `title`,
  `url`, `state`, `date`, `fetched_at`
- Index `github_cache_type_fetched_idx` on `(type, fetched_at)`

No changes to existing tables.
