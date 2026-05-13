# Task List — GitHub Activity on Dashboard

**Feature slug:** `github-activity`  
**Design:** [github-activity-design.md](./github-activity-design.md)  
**Spec:** [github-activity-spec.md](./github-activity-spec.md)  
**Architecture:** Backend owns cache (SQLAlchemy + Alembic). Frontend is HTTP-only.

Execute tasks one by one using `/build`. Do not start a task until all tasks above it are complete.

---

## Database

- [x] **Define `GitHubCacheItem` SQLAlchemy model**
  `backend/app/models/github.py`
  Create `GitHubCacheItem` inheriting from `Base` with columns: `id` (PK), `type` (str), `external_id` (str), `repo` (str), `title` (str), `url` (str), `state` (str, nullable), `date` (datetime), `fetched_at` (datetime, UTC default); add `github_cache_type_fetched_idx` index on `(type, fetched_at)`.

- [x] **Generate and apply Alembic migration for `github_cache`**
  `backend/alembic/versions/<hash>_create_github_cache_table.py`
  Run `uv run alembic revision --autogenerate -m "create github_cache table"` then `uv run alembic upgrade head`; verify the `github_cache` table exists in `dev-digest.db`.

---

## Backend

- [x] **Add Pydantic schemas for GitHub responses**
  `backend/app/models/github.py`
  Add `GitHubCommitRead` (sha, message, repo, url, date) and `GitHubPRRead` (number, title, repo, url, state, date) using Pydantic v2 `ConfigDict(from_attributes=True)`.

- [x] **Implement GitHub service helpers**
  `backend/app/services/github.py`
  Create `fetch_commits_from_github(token, username)` and `fetch_pulls_from_github(token, username)` async functions using `httpx.AsyncClient`; call GitHub Search API with 7-day date range; return lists of dicts; raise `HTTPException(401)` on auth failure, `HTTPException(502)` on other errors.

- [x] **Implement the GitHub router**
  `backend/app/routes/github.py`
  Add `GET /github/commits` and `GET /github/pulls` with `refresh: bool = False` query param; implement TTL check (15 min) against `fetched_at`; on cache miss or `refresh=True` delete old rows, call service helpers, insert fresh rows; return `list[GitHubCommitRead]` or `list[GitHubPRRead]`; read `GITHUB_TOKEN` and `GITHUB_USERNAME` from `os.environ`.

- [x] **Mount GitHub router in main.py and add httpx dependency**
  `backend/app/main.py`, `backend/pyproject.toml`
  Run `uv add httpx`; import and mount `github_router` with `app.include_router(github_router)`; verify `GET /github/commits` and `GET /github/pulls` appear in Swagger UI at `/docs`.

---

## Frontend

- [x] **Add `GitHubCommit` and `GitHubPR` types**
  `frontend/src/lib/types.ts`
  Append `GitHubCommit` (sha, message, repo, url, date: string) and `GitHubPR` (number, title, repo, url, state: "open"|"merged", date: string) type exports.

- [x] **Add `getCommits` and `getPulls` fetch helpers**
  `frontend/src/lib/api.ts`
  Implement `getCommits(refresh = false): Promise<GitHubCommit[]>` and `getPulls(refresh = false): Promise<GitHubPR[]>`; append `?refresh=true` when refresh is true; throw on non-ok responses.

- [x] **Build `GitHubActivityWidget` component**
  `frontend/src/components/features/GitHubActivityWidget.tsx`
  Client Component owning `commits`, `pulls`, `loading`, and `error` state; renders widget header with "Refresh" button, loading spinner, error banner, combined activity list sorted by date descending (commit icon vs PR icon, repo badge, date, external link), and empty-state message when both lists are empty.

- [x] **Update `LogDashboard` to render the widget**
  `frontend/src/components/features/LogDashboard.tsx`
  Add `initialCommits: GitHubCommit[]` and `initialPulls: GitHubPR[]` props; render `<GitHubActivityWidget>` alongside `<LogList>`.

- [x] **Update dashboard page to fetch GitHub data**
  `frontend/src/app/page.tsx`
  Replace sequential fetches with `Promise.all([getLogs(), getCommits().catch(()=>[]), getPulls().catch(()=>[])])`; pass `commits` and `pulls` to `<LogDashboard>`; graceful degradation means log list always renders even if GitHub API fails.

---

## MCP

- [x] **Add `get_github_commits` and `get_github_pulls` MCP tools**
  `mcp-server/server.py`
  Add `@mcp.tool()` async functions: `get_github_commits(refresh: bool = False)` calling `GET :8000/github/commits` and `get_github_pulls(refresh: bool = False)` calling `GET :8000/github/pulls`; each appends `?refresh=true` when the param is set.

---

## Docs

- [x] **Mark task list complete**
  `docs/specs/github-activity-tasks.md`
  Check off each task as it is completed using `/build`.
