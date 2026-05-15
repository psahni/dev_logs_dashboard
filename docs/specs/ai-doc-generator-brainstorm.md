# Brainstorm — AI Document Generator

**Feature slug:** `ai-doc-generator`
**Status:** Approach 1 chosen

---

## Feature Idea

Generate two types of documents from dev logs and GitHub activity from the last 7 days:

1. **Confluence Doc** — professional weekly engineering summary in Confluence wiki markup, ready to copy-paste
2. **Standup** — concise daily standup (yesterday / today / blockers) in plain text

Both triggered by separate buttons on the dashboard. Output displayed on screen for manual copying. No external posting or scheduling.

---

## Clarifying Questions & Answers

**1. Who is the primary user?**
Just me — solo developer, personal tool.

**2. What does success look like in one sentence?**
I click either Generate Confluence Doc or Generate Standup, Claude reads my real logs and GitHub activity, and displays the formatted output on screen ready to copy in under 30 seconds.

**3. Is there anything this feature should explicitly NOT do?**
- Do NOT connect to Confluence API
- Do NOT post to Slack or any standup tool automatically
- Do NOT make up content — only use real logs and GitHub data
- Do NOT require any form input
- No scheduling or automation — manual trigger only
- No editing of output inside the app — copy only
- Confluence doc uses wiki markup only
- Standup uses plain text only

---

## Approach 1 — Backend-Owned Generation (FastAPI calls Claude) ✅ CHOSEN

**Summary**
Two new FastAPI endpoints (`POST /generate/confluence` and `POST /generate/standup`) each fetch logs and GitHub activity from the database, assemble a structured prompt, call the Anthropic API via `httpx`, and return the completed text. The frontend fires a request and displays whatever comes back.

**Pros**
- API key lives only on the server — never exposed to the browser
- All prompt engineering in one place (Python)
- Frontend stays simple: one `fetch()` call per button, display result
- Easy to add caching (don't regenerate if data hasn't changed)

**Cons**
- Adds `GROQ_API_KEY` to `backend/.env`; uses existing `httpx` dependency
- Response time is synchronous — UI shows a spinner until the full text is ready (10–20s)
- Prompt logic is buried in the backend, harder to iterate quickly

**Best suited when**
You want strict API key security and a clean frontend with no AI knowledge.

---

## Approach 2 — Frontend Assembles Prompt, Backend Proxies Claude

**Summary**
The frontend calls existing `/logs`, `/github/commits`, and `/github/pulls` endpoints to gather data, assembles the full prompt in TypeScript, then sends it to a thin `POST /ai/generate` proxy on FastAPI. The backend only forwards the prompt to Claude and returns the response.

**Pros**
- Prompt engineering lives in TypeScript — fast iteration without touching the backend
- Backend proxy is tiny and reusable for any future AI feature
- Clear separation: data layer vs AI layer vs display

**Cons**
- Frontend has to call 3 endpoints before generating — extra round-trips
- Prompt logic is split across frontend and backend
- Still synchronous wait for the full response

**Best suited when**
You expect to iterate heavily on prompt wording and want to do it without backend deploys.

---

## Approach 3 — Streaming Response (SSE from FastAPI)

**Summary**
Same as Approach 1 but uses FastAPI's `StreamingResponse` and Claude's streaming API to pipe tokens back to the browser as Server-Sent Events. The frontend renders text word-by-word as it arrives, giving real-time feedback.

**Pros**
- Output appears immediately — first words show in under 2 seconds
- Feels fast even if total generation takes 15–20s
- No timeout risk on long responses

**Cons**
- More complex frontend: needs `EventSource` or streaming `fetch` body reader
- More complex backend: `StreamingResponse` + async generator pattern
- Harder to test and debug

**Best suited when**
Generation latency is noticeable and you want the output to feel live.

---

## Recommendation

**Approach 1** for v1. Simplest path to working: two clean endpoints, API key stays on the server, frontend is just two buttons with a spinner. Streaming (Approach 3) can be layered on later as a pure UX improvement.
