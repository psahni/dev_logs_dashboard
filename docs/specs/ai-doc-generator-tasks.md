# Task List — AI Document Generator

**Feature slug:** `ai-doc-generator`
**Design:** [ai-doc-generator-design.md](./ai-doc-generator-design.md)
**Spec:** [ai-doc-generator-spec.md](./ai-doc-generator-spec.md)
**Architecture:** Backend calls Groq API via httpx. Frontend is HTTP-only. No new DB tables.

Execute tasks one by one using `/build`. Do not start a task until all tasks above it are complete.

---

## Backend

- [x] **Implement Groq service helper**
  `backend/app/services/groq.py`
  Create `call_groq(api_key, system_prompt, user_prompt) -> str` async function using `httpx.AsyncClient` to call `https://api.groq.com/openai/v1/chat/completions` with model `llama-3.3-70b-versatile`, temperature 0.3, timeout 60s; raise `HTTPException(502)` on non-200 from Groq.

- [x] **Implement the generate router**
  `backend/app/routes/generate.py`
  Define `GenerateResponse(BaseModel)` with a single `content: str` field; add `_get_api_key()` helper that reads `GROQ_API_KEY` from env and raises `HTTPException(401)` if missing; add `_fetch_context(db)` that queries `Log` rows and `GitHubCacheItem` rows from the last 7 days; add `_build_confluence_prompt(context)` and `_build_standup_prompt(context)` prompt builders; implement `POST /generate/confluence` and `POST /generate/standup` routes that wire everything together and return `GenerateResponse`.

- [x] **Mount generate router in main.py**
  `backend/app/main.py`
  Import and mount `generate_router` with `app.include_router(generate_router)`; verify `POST /generate/confluence` and `POST /generate/standup` appear in Swagger UI at `/docs`.

---

## Frontend

- [x] **Add `generateConfluence` and `generateStandup` fetch helpers**
  `frontend/src/lib/api.ts`
  Implement `generateConfluence(): Promise<string>` and `generateStandup(): Promise<string>`; each POSTs to the corresponding backend endpoint with `cache: "no-store"`, returns `data.content`, and throws on non-ok responses.

- [x] **Build `GeneratePanel` component**
  `frontend/src/components/features/GeneratePanel.tsx`
  Client Component accepting `type: "confluence" | "standup"` and `label: string` props; owns `output`, `loading`, `error`, and `copied` state; renders a generate button, loading spinner, error banner, read-only `<pre>` output block with monospace font, and a "Copy" button that calls `navigator.clipboard.writeText` and briefly shows "Copied!"; empty state before first generation shows nothing.

- [x] **Update `LogDashboard` to render generate panels**
  `frontend/src/components/features/LogDashboard.tsx`
  Add a toolbar row between the header and the two-column grid containing `<GeneratePanel type="standup" label="Generate Standup" />` and `<GeneratePanel type="confluence" label="Generate Confluence Doc" />`; both panels render independently.

---

## Docs

- [x] **Mark task list complete**
  `docs/specs/ai-doc-generator-tasks.md`
  Check off each task as it is completed using `/build`.
