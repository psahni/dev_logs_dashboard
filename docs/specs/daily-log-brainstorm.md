# Brainstorm — Daily Dev Log

**Feature slug:** `daily-log`  
**Status:** Retrospective (feature was built before the SDD pipeline was in place)

---

## Context

As a solo developer, context evaporates fast. Without a structured place to record what
was worked on each day, standups, retrospectives, and weekly digests have to be
reconstructed from memory or git history. The Daily Dev Log is the data foundation that
every other Dev Digest feature depends on.

---

## Clarifying Questions & Answers

**1. Who is the primary user of this feature?**  
Just me — solo developer, personal tool only.

**2. What does success look like in one sentence?**  
I can open the app, write a quick entry about what I worked on today, tag it, and see my
full history in reverse-chronological order.

**3. Is there anything this feature should explicitly NOT do?**  
No authentication, no multiple users, no editing or deleting entries, no search or
pagination in v1.

---

## Approach 1 — Frontend-Only (localStorage)

**Summary**  
Store log entries directly in the browser's `localStorage`. No backend, no database.
The Next.js page reads and writes entries client-side using a simple JSON array.

**Pros**
- Zero backend work — ships in an afternoon
- No infrastructure to set up or maintain
- Instant reads and writes (no network round-trip)

**Cons**
- Data is locked to one browser/device — no portability
- Cleared if the user wipes browser data or uses a private window
- Can't be read by the MCP server or any other service
- No foundation for future features (standups, digests) that need server-side data

**Best suited when**  
You want a throwaway prototype with no plans to build further features on top of it.

---

## Approach 2 — Full Stack (Next.js → FastAPI → SQLite)

**Summary**  
The FastAPI backend owns the database. A `logs` table is defined via SQLAlchemy and
managed by Alembic. The frontend is a pure HTTP client that calls `POST /logs` and
`GET /logs`. The MCP server calls the same endpoints. All data lives durably in
`dev-digest.db`.

**Pros**
- Single source of truth — all clients (browser, MCP) share the same data
- Durable SQLite storage survives browser clears, device switches, etc.
- Clean separation: frontend has zero DB knowledge
- Solid foundation for every downstream feature (standups, GitHub activity, digests)
- MCP server can create and read logs via HTTP without any special access

**Cons**
- Requires running two processes (frontend + backend) locally
- Slightly more boilerplate to set up (SQLAlchemy model, Alembic migration, routes)

**Best suited when**  
You're building a real personal tool that you'll keep using and extend with more features.

---

## Approach 3 — Next.js API Routes + SQLite (No Separate Backend)

**Summary**  
Use Next.js API Routes (or Route Handlers) to handle `POST /api/logs` and
`GET /api/logs`. The database is accessed directly from the Next.js server using a
lightweight SQLite library (e.g. `better-sqlite3`). No separate FastAPI process.

**Pros**
- Single process to run — simpler local dev setup
- TypeScript end-to-end — schema and API in one codebase
- No Python dependency for basic CRUD

**Cons**
- Mixes frontend and backend concerns in the same process
- `better-sqlite3` is a native module — complicates deployment and CI
- MCP server (Python) would need to call Next.js API routes, which is unusual
- Makes it harder to add a proper Python backend later if needed

**Best suited when**  
The project will stay purely TypeScript and you never need a Python backend or MCP
integration.

---

## Recommendation

**Approach 2 — Full Stack (Next.js → FastAPI → SQLite)**

For a personal dev dashboard that will grow into standups, digests, and AI-assisted
features, the clean architecture of a dedicated FastAPI backend is worth the small
extra setup cost. Every other Dev Digest feature benefits from having a single durable
HTTP API as the data layer, and the MCP server integration becomes trivial.

**Chosen approach:** Approach 2 — implemented in `daily-log-spec.md`.
