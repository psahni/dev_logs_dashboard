# Feature Spec — GitHub Activity on Dashboard

**Feature slug:** `github-activity`  
**Brainstorm:** [github-activity-brainstorm.md](./github-activity-brainstorm.md)  
**Approach chosen:** Backend Cache in SQLite with force-refresh query param

---

## 1. Problem Statement

When reviewing my day or preparing a standup, I have to manually switch between the
Dev Digest dashboard and GitHub to piece together what I actually shipped. There is no
single view connecting my written dev logs with the commits and PRs that produced them.

This feature solves that by automatically fetching my GitHub commits and PRs for the
last 7 days and displaying them alongside dev logs on the dashboard — no copy-pasting,
no tab-switching. The FastAPI backend caches the GitHub data in SQLite to keep page
loads fast and stay within rate limits, with a "Refresh" button to force a re-fetch
on demand.

---

## 2. Functional Requirements

- The system **shall** fetch commits authored by the configured GitHub user from the
  last 7 days via the GitHub REST API.
- The system **shall** fetch pull requests opened or merged by the configured GitHub
  user in the last 7 days via the GitHub REST API.
- The system **shall** cache fetched GitHub activity in SQLite with a TTL of 15 minutes.
- The system **shall** return cached data on subsequent requests within the TTL window
  without calling the GitHub API.
- The system **shall** accept a `?refresh=true` query parameter on both
  `GET /github/commits` and `GET /github/pulls` that deletes cached rows and re-fetches
  from GitHub before returning.
- The system **shall** read the GitHub personal access token from a `GITHUB_TOKEN`
  backend environment variable.
- The system **shall** read the target GitHub username from a `GITHUB_USERNAME`
  backend environment variable.
- The dashboard **shall** display commits and PRs in a dedicated section alongside the
  dev log list.
- The dashboard **shall** include a "Refresh" button that triggers cache invalidation
  and re-fetches both commits and PRs.
- The dashboard **shall** show a loading state while GitHub data is being fetched.

---

## 3. Non-Functional Requirements

- **Performance:** Cached responses must return in under 100ms. Live GitHub API calls
  are acceptable up to 2 seconds; the UI must not block log display while fetching.
- **Security:** `GITHUB_TOKEN` must never be exposed to the frontend or logged.
  Read-only token scope (`repo:read` or `public_repo`) is sufficient.
- **Reliability:** If the GitHub API call fails (network error, rate limit, invalid
  token), the endpoint shall return a descriptive error and the dashboard shall show
  a non-blocking error state rather than crashing.
- **Data freshness:** Cached data may be up to 15 minutes old. This is acceptable for
  a personal dashboard.
- **Rate limits:** GitHub REST API allows 5,000 authenticated requests per hour.
  With a 15-minute TTL, maximum consumption is 8 refreshes/hour — well within limits.

---

## 4. Constraints

- **Backend owns all external API calls.** The frontend never calls the GitHub API
  directly; it goes through FastAPI at `http://localhost:8000`.
- **SQLAlchemy 2.x + Alembic** manage the cache table — no raw SQL, no hand-edits
  to the database.
- **Personal access token only** — no OAuth flow, no GitHub App, no device flow.
- **Single SQLite file** (`dev-digest.db`) shared by all backend models.
- **`backend/` and `mcp-server/` are independent uv projects** — no shared deps.
- **httpx** is used for all HTTP calls from FastAPI to the GitHub API (already available
  as a transitive dep; add explicitly via `uv add httpx`).
- The frontend accesses GitHub data exclusively via HTTP calls to FastAPI — no direct
  GitHub API calls from Next.js.

---

## 5. Out of Scope

- OAuth / GitHub App authentication flow
- Writing back to GitHub (creating issues, PRs, comments, etc.)
- Real-time updates or webhooks
- Multiple GitHub accounts
- Repositories the token cannot access
- Pagination beyond last 7 days
- Commit diffs or file-level change details
- Linking dev log entries to specific commits or PRs automatically
- Search or filtering of GitHub activity
- Notifications or alerts based on GitHub activity

---

## 6. Acceptance Criteria

1. `GET /github/commits` returns a JSON array of commits from the last 7 days for
   the configured username; each item has `sha`, `message`, `repo`, `url`, `date`.
2. `GET /github/pulls` returns a JSON array of PRs from the last 7 days; each item
   has `number`, `title`, `repo`, `url`, `state` (`open` | `merged`), `date`.
3. A second request within 15 minutes returns cached data without hitting the GitHub API
   (verifiable via backend logs showing no outbound HTTP call).
4. `GET /github/commits?refresh=true` deletes the cache and returns freshly fetched data.
5. `GET /github/pulls?refresh=true` deletes the cache and returns freshly fetched data.
6. With `GITHUB_TOKEN` unset or invalid, both endpoints return HTTP 401 with a clear
   error message; the dashboard shows a non-blocking error banner.
7. The dashboard displays a **GitHub Activity** section with separate commit and PR lists.
8. The dashboard "Refresh" button calls both endpoints with `?refresh=true` and updates
   the UI with the new data.
9. Dev logs load and display normally even if the GitHub API call is slow or failing —
   the two sections are fetched independently.
10. `GITHUB_TOKEN` does not appear in any API response, frontend bundle, or server log.

---

## 7. Open Questions — Resolved

1. **Commit scope** — all repos accessible by the token, filtered by author. ✅
2. **PR filter** — only PRs opened or merged by the user (not reviewed). ✅
3. **Cache granularity** — one row per item (commit or PR) for future queryability. ✅
4. **Dashboard layout** — single combined **GitHub Activity widget** showing commits
   and PRs together, displayed alongside the dev log list. ✅
5. **Empty state** — show a message ("No GitHub activity in the last 7 days") when
   no commits or PRs exist; do not hide the widget. ✅
