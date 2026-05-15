# Feature Spec — AI Document Generator

**Status:** Approved
**Feature slug:** `ai-doc-generator`
**Chosen approach:** Backend-Owned Generation (FastAPI calls Claude API)

---

## 1. Problem Statement

Writing a weekly Confluence summary or daily standup from scratch is tedious and easy
to skip. The raw material already exists in Dev Digest — dev logs and GitHub activity
— but turning it into a polished document takes non-trivial time and mental effort.

This feature eliminates that friction. One click reads your real data, sends it to
Claude, and returns a ready-to-copy document in the right format. It makes consistent
engineering communication effortless without requiring any external integrations.

---

## 2. Functional Requirements

- The system **shall** expose a `POST /generate/confluence` endpoint that reads all
  dev logs and GitHub commits/PRs from the last 7 days and returns a Confluence wiki
  markup document as a plain text string.
- The system **shall** expose a `POST /generate/standup` endpoint that reads the same
  data and returns a plain-text daily standup covering yesterday, today, and blockers.
- Both endpoints **shall** call the **Groq API** (OpenAI-compatible) using `httpx`,
  with a structured prompt that includes the actual log and GitHub data.
- Both endpoints **shall** return a JSON response with a single `content` field
  containing the generated text.
- The frontend **shall** display a "Generate Confluence Doc" button and a "Generate
  Standup" button on the dashboard.
- Clicking either button **shall** call the corresponding backend endpoint, show a
  loading state while waiting, then display the returned text in a read-only output
  panel.
- The output panel **shall** include a "Copy to clipboard" button that copies the full
  generated text.
- If generation fails, the frontend **shall** display a clear error message.
- The backend **shall** read the `GROQ_API_KEY` from environment variables; if
  missing, the endpoint **shall** return HTTP 401.

---

## 3. Non-Functional Requirements

- **Latency:** Generation should complete in under 30 seconds for a typical week's
  worth of data (≤ 20 log entries, ≤ 30 GitHub items).
- **Security:** `GROQ_API_KEY` must never be sent to or stored in the frontend.
  It is read from `backend/.env` at startup only.
- **Accuracy:** Prompts must instruct Claude to use only the provided data — no
  hallucinated tasks or fabricated PRs.
- **Idempotency:** Calling the same endpoint twice with the same underlying data may
  return slightly different phrasing (LLM non-determinism is acceptable); the data
  content must be consistent.
- **No persistence:** Generated documents are not stored in the database. They exist
  only in the frontend until the user copies or navigates away.

---

## 4. Constraints

- Backend uses **Python FastAPI + uv**; Groq is called via `httpx.AsyncClient` using
  Groq's OpenAI-compatible REST API (`https://api.groq.com/openai/v1/chat/completions`)
  — no extra SDK required.
- Database is owned exclusively by the FastAPI backend via **SQLAlchemy 2.x**; the
  generate endpoints query logs and GitHub cache directly from the DB session.
- `GROQ_API_KEY` is loaded from `backend/.env` via `python-dotenv` (already wired
  in `main.py`).
- Frontend is a **pure HTTP client** — it calls `POST /generate/confluence` and
  `POST /generate/standup` only; no AI SDK in the frontend.
- MCP server is **not involved** in generation — this is a direct user-triggered
  action from the dashboard.
- `backend/` and `mcp-server/` remain independent Python projects with separate
  `pyproject.toml` files.
- Confluence output must be **wiki markup only** (not Markdown, not HTML).
- Standup output must be **plain text only**.

---

## 5. Out of Scope

- Posting to Confluence via API
- Posting to Slack, Teams, or any standup tool
- Scheduling or automatic generation
- Editing the generated output inside the app
- Storing generated documents in the database
- Streaming / token-by-token display (can be added in v2)
- User-configurable prompts or templates
- Multi-user support or authentication
- Generation from a custom date range (always last 7 days)

---

## 6. Acceptance Criteria

1. `POST /generate/standup` returns HTTP 200 with `{ "content": "<plain text>" }` when
   logs and GitHub data exist.
2. `POST /generate/confluence` returns HTTP 200 with `{ "content": "<wiki markup>" }`
   when logs and GitHub data exist.
3. Both endpoints return HTTP 200 with an appropriate empty-state message (e.g.
   "No activity found for the last 7 days.") when no logs or GitHub data exist —
   they do not error.
4. Both endpoints return HTTP 401 when `GROQ_API_KEY` is not set.
5. The generated standup contains three clearly labelled sections: yesterday, today,
   and blockers.
6. The generated Confluence doc contains valid wiki markup (headings use `h2.`, bold
   uses `*text*`, lists use `*` bullets).
7. The dashboard shows a "Generate Confluence Doc" button and a "Generate Standup"
   button.
8. Clicking either button shows a visible loading state until the response arrives.
9. The output panel displays the generated text in a monospace, read-only element.
10. The "Copy" button copies the full generated text to the clipboard.
11. If the backend returns an error, the frontend displays the error message — it does
    not show a blank panel.
12. `GROQ_API_KEY` does not appear in any frontend bundle, network request from
    the browser, or browser console.

---

## 7. Open Questions

| # | Question | Decision |
|---|---|---|
| 1 | Which Groq model? | `llama-3.3-70b-versatile` — best balance of quality and speed available on Groq |
| 2 | Standup "today" section — use today's logs or infer from recent patterns? | Use today's logs if they exist; otherwise use the most recent logs with a note |
| 3 | Should the Confluence doc include a GitHub activity section? | Yes — separate sections for commits and PRs |
| 4 | Where on the dashboard do the buttons live? | New "Generate" toolbar row below the existing header, above the log list |
