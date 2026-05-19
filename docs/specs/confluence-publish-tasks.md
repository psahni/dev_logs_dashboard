# Task List — Confluence Publish Integration

**Design:** `docs/specs/confluence-publish-design.md`
**Spec:** `docs/specs/confluence-publish-spec.md`

---

## Phase 1 — Backend Service

- [x] **Task 1: Create `backend/app/services/confluence.py`**
  - File: `backend/app/services/confluence.py`
  - Async function `publish_page(base_url, email, token, space_id, title, content) -> str`
  - Calls `POST {base_url}/wiki/api/v2/pages` via `httpx.AsyncClient(timeout=30)`
  - Auth: `Authorization: Basic base64(email:token)`
  - Body: `{ spaceId, status: "current", title, body: { representation: "wiki", value: content } }`
  - Returns full page URL: `base_url + response["_links"]["webui"]`
  - Raises `HTTPException(502)` on Atlassian API error

- [x] **Task 2: Create `backend/app/routes/confluence.py`**
  - File: `backend/app/routes/confluence.py`
  - `PublishRequest(BaseModel)`: `title: str`, `content: str`
  - `PublishResponse(BaseModel)`: `page_url: str`
  - `StatusResponse(BaseModel)`: `connected: bool`
  - `POST /confluence/publish` → reads env vars, calls `publish_page`, returns `PublishResponse`
  - `GET /confluence/status` → returns `{ connected: bool }` based on whether `CONFLUENCE_API_TOKEN` is set
  - Returns `HTTP 401` if token missing, `HTTP 400` if any other required env var missing

- [x] **Task 3: Mount confluence router in `backend/app/main.py`**
  - File: `backend/app/main.py`
  - Add `from app.routes.confluence import router as confluence_router`
  - Add `app.include_router(confluence_router)`

- [x] **Task 4: Update `backend/.env.example`**
  - File: `backend/.env.example`
  - Add four Confluence variables with empty values:
    `CONFLUENCE_BASE_URL=`, `CONFLUENCE_EMAIL=`, `CONFLUENCE_API_TOKEN=`, `CONFLUENCE_SPACE_ID=`

---

## Phase 2 — Frontend API Helper

- [x] **Task 5: Add `publishToConfluence` to `frontend/src/lib/api.ts`**
  - File: `frontend/src/lib/api.ts`
  - `async function publishToConfluence(title: string, content: string): Promise<{ page_url: string }>`
  - `POST /confluence/publish` with JSON body `{ title, content }`
  - Throws on non-ok response

---

## Phase 3 — Frontend Views

- [x] **Task 6: Update `ConfluenceView` to add Publish button and success state**
  - File: `frontend/src/components/views/ConfluenceView.tsx`
  - Add `useTransition` for `publishing` state (separate from existing `isPending`)
  - Add `pageUrl: string | null` state
  - Add "Publish to Confluence" button: disabled when `output` is null or `publishing` is true
  - On success: show a "Published! View page →" link using `pageUrl`
  - On error: show in `error-banner`
  - Auto-generate title: `"Weekly Engineering Summary — {current date}"`

- [x] **Task 7: Make Settings page Confluence status dynamic**
  - Files: `frontend/src/app/settings/page.tsx`, `frontend/src/components/views/SettingsView.tsx`
  - `settings/page.tsx`: fetch `GET /confluence/status` server-side, pass `confluenceConnected: boolean` as prop
  - `SettingsView.tsx`: accept `confluenceConnected` prop, use it to drive the Confluence card chip
  - Remove hardcoded `connected: false` for Confluence card

---

## Phase 4 — Docs

- [x] **Task 8: Mark all tasks complete and commit docs**
  - Files: `docs/specs/confluence-publish-tasks.md`
  - Check off all tasks after implementation

---

## Summary

| Phase | Tasks | Files |
|---|---|---|
| Backend Service | 1–4 | `services/confluence.py`, `routes/confluence.py`, `main.py`, `.env.example` |
| Frontend API | 5 | `lib/api.ts` |
| Frontend Views | 6–7 | `ConfluenceView.tsx`, `settings/page.tsx`, `SettingsView.tsx` |
| Docs | 8 | `confluence-publish-tasks.md` |
