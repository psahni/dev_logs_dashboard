# Feature Spec — Daily Dev Log

**Status:** Approved  
**Feature slug:** `daily-log`  
**Chosen approach:** Full Stack (Next.js → FastAPI → SQLite)

---

## 1. Problem Statement

Without a structured place to record daily work, context evaporates. A developer finishing a week of work can't easily recall what they built on Tuesday, what decisions they made, or what topics they touched. This makes standups, retrospectives, and weekly digests harder to produce accurately.

This feature gives the developer a single, frictionless place to write a daily log entry — title, description, tags — and retrieve the full history in reverse-chronological order. It is the data foundation that every other Dev Digest feature (standups, newsletters, digests) depends on.

---

## 2. Functional Requirements

- The system **shall** allow the user to create a log entry with three fields: `title` (short text), `description` (required longer text), and `tags` (comma-separated string, optional).
- The system **shall** automatically record a `created_at` timestamp on every log entry at the time of creation.
- The system **shall** expose a `POST /logs` endpoint that accepts a log entry and persists it to `dev-digest.db`.
- The system **shall** expose a `GET /logs` endpoint that returns all log entries ordered by `created_at` descending (newest first).
- The system **shall** display a single-page dashboard showing the log list and a "New Log" button.
- The system **shall** open a modal/popup when the "New Log" button is clicked, containing the create form.
- The system **shall** display a list of all past log entries ordered newest-first, showing title, description, tags (as chips), and date for each entry.
- The system **shall** reflect a newly created entry at the top of the list immediately after the modal closes successfully.

---

## 3. Non-Functional Requirements

- **Simplicity:** The create form opens in a modal from the main page — no navigation required.
- **Speed:** The list page must load in under 1 second on localhost with up to 500 log entries.
- **Persistence:** All entries are durably written to `dev-digest.db` before the UI confirms success.
- **No auth overhead:** No login, session, or token handling of any kind.

---

## 4. Constraints

- Drizzle ORM (`drizzle-orm/sqlite-core`) is used for schema definition and all frontend database access. No Prisma, no raw SQL in application code.
- The backend (FastAPI) accesses `dev-digest.db` via Python's `sqlite3` stdlib. No SQLAlchemy, no ORM.
- The MCP server must access logs through `POST /logs` and `GET /logs` — never by touching `dev-digest.db` directly.
- `backend/` and `mcp-server/` are independent `uv` projects with separate `pyproject.toml` files.
- Single database file at repo root: `dev-digest.db`.
- Tags stored as a plain comma-separated string (e.g. `"fastapi,drizzle,sqlite"`) — no separate tags table.

---

## 5. Out of Scope

- User authentication or session management
- Multiple users or user accounts
- Editing or deleting existing log entries
- Search, filtering, or pagination of the log list
- Rich text or Markdown rendering — plain `<textarea>` only
- Tag autocomplete, tag management UI, or tag normalization
- Email or push notifications
- Integration with any external service

---

## 6. Acceptance Criteria

1. A `logs` table exists in `dev-digest.db` with columns: `id`, `title`, `description`, `tags`, `created_at`.
2. `POST /logs` with a valid `{ title, description, tags }` body returns HTTP 201 and the created entry (including `id` and `created_at`).
3. `POST /logs` with a missing `title` or missing `description` returns HTTP 422.
4. `GET /logs` returns an array of all log entries ordered by `created_at` descending.
5. `GET /logs` returns an empty array (not an error) when no entries exist.
6. The dashboard page shows the log list and a visible "New Log" button.
7. Clicking "New Log" opens a modal with fields for title, description, and tags.
8. Submitting the modal form with all required fields saves the entry and closes the modal, showing the new entry at the top of the list.
9. Submitting the modal form with an empty `title` or empty `description` shows a validation error and does not submit.
10. `tags` accepts an empty string (no tags) without error.
11. Tags render as individual styled chips/badges in the log list (not as a plain comma-separated string).
12. The MCP server can call `POST /logs` via HTTP and receive a 201 response.

---

## 7. Resolved Decisions

| Question | Decision |
|---|---|
| Same page or separate pages? | Single page. Create form opens in a modal popup. |
| Tags display format? | Styled chips/badges in the list view. |
| Description required? | Yes, description is required. |
