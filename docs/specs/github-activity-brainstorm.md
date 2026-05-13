# Brainstorm — GitHub Activity on Dashboard

**Feature:** Automatically pull GitHub commits and PRs for a given date range and
display them alongside dev logs on the dashboard.

**User:** Solo developer, personal tool only.  
**Success:** See GitHub commits and PRs for the last 7 days on the dashboard next to
dev logs, fetched automatically without copying anything manually.  
**Out of scope:** OAuth flow, writing back to GitHub, real-time/webhooks, multiple
accounts, pagination.

---

## Approach 1 — Backend Proxy (Fetch on Request)

**Summary:** FastAPI adds two new endpoints (`GET /github/commits`,
`GET /github/pulls`) that call the GitHub API on demand using a personal access token
stored in a backend env var. The frontend calls these endpoints the same way it calls
`/logs` — the dashboard fetches all three in parallel on page load.

**Pros:**
- Always fresh data — every load reflects the true current state
- Token lives only in the backend `.env` — never exposed to the browser
- Follows the existing architecture exactly (frontend → FastAPI → external)
- Minimal new code — two route handlers, one httpx call each

**Cons:**
- Every page load makes two live GitHub API calls — adds ~300–500ms latency
- If GitHub is slow or down, the dashboard stalls
- Counts against GitHub's 5,000 req/hr rate limit (negligible for personal use)

**Best suited when:** You want the simplest possible implementation and don't mind a
slightly slower page load. Perfect for personal use where you're the only person
hitting the dashboard.

---

## Approach 2 — Backend Cache in SQLite ✅ CHOSEN

**Summary:** FastAPI fetches GitHub activity on first request and caches the result in
SQLite (new `github_activity` table). On subsequent requests within a TTL (e.g., 15
minutes), it returns cached rows. On miss or expiry, it re-fetches and updates.

**Pros:** Fast page loads, rate-limit safe, data persists for historical queries.  
**Cons:** More complex (new model, migration, cache logic), data can be stale up to TTL.

---

## Approach 3 — Next.js Server Component Direct Fetch

**Summary:** The dashboard Server Component calls the GitHub API directly using
`GITHUB_TOKEN` from Next.js env vars. Next.js handles caching via `revalidate`.

**Pros:** Zero backend changes, minimal code.  
**Cons:** Splits data fetching across two layers, token in frontend env, GitHub data
inaccessible from MCP tools or future backend features.

---

## Decision

**Approach 2 chosen** with **Option A (force-refresh query param).**

SQLite cache with a 15-minute TTL for fast page loads and rate-limit safety.
Endpoints accept `?refresh=true` to delete cached rows and re-fetch from GitHub on
demand — frontend exposes a "Refresh" button that triggers this. Token stored in
backend `.env` only. Natural upgrade path for a future standup generator or weekly
digest that needs stored GitHub history.
