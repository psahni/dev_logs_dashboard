# Feature Spec — Confluence Publish Integration

**Status:** Approved
**Feature slug:** `confluence-publish`

---

## 1. Problem Statement

The app already generates a Confluence-ready wiki markup document from the user's dev
logs and GitHub activity (via Groq). Currently the user must manually copy the output
and paste it into Confluence. This feature closes that gap: a single "Publish" button
sends the generated content directly to a Confluence page.

---

## 2. Functional Requirements

- The app **shall** read `CONFLUENCE_BASE_URL`, `CONFLUENCE_EMAIL`,
  `CONFLUENCE_API_TOKEN`, and `CONFLUENCE_SPACE_ID` from `backend/.env`.
- The backend **shall** expose a `POST /confluence/publish` endpoint that accepts
  a title and wiki markup body and creates a new page in the configured Confluence space.
- The endpoint **shall** return the URL of the newly created page on success.
- The frontend **shall** show a "Publish to Confluence" button in `ConfluenceView`
  that is only enabled after content has been generated.
- On success the frontend **shall** show a "Published!" confirmation with a link to
  the created page.
- On failure the frontend **shall** show the error message returned by the backend.
- The Settings page **shall** show Confluence as "Connected" when
  `CONFLUENCE_API_TOKEN` is present in the environment.

---

## 3. Non-Functional Requirements

- The Confluence API call is made exclusively from the FastAPI backend — the token
  never reaches the frontend.
- Publish is a one-way write operation: it always creates a new page (no update/delete).
- Timeout: 30 seconds for the Confluence API call (Atlassian can be slow).

---

## 4. Constraints

- Backend only for API integration — no frontend env vars, no token exposure.
- Uses Confluence Cloud REST API v2 (`/wiki/api/v2/pages`).
- Auth: HTTP Basic with `email:api_token` (base64), as required by Atlassian Cloud.
- Wiki markup format (`representation: "wiki"`) — matches what the Groq prompt already generates.
- No new npm packages. One new Python dependency: none needed — `httpx` is already installed.

---

## 5. Out of Scope

- Updating or deleting existing Confluence pages.
- Selecting which Confluence space to publish to at runtime (space is fixed via env var).
- Confluence OAuth flow (API token is sufficient for personal use).
- Jira integration.

---

## 6. Acceptance Criteria

1. `POST /confluence/publish` with `{ title, content }` creates a page and returns
   `{ page_url }`.
2. If `CONFLUENCE_API_TOKEN` is not set, the endpoint returns HTTP 401.
3. If the Confluence API returns an error, the endpoint returns HTTP 502 with the
   Atlassian error message.
4. The "Publish to Confluence" button is disabled until content is generated.
5. After a successful publish, a link to the new Confluence page is shown in the UI.
6. The Settings page shows Confluence as "Connected" (green chip) when the token
   is present, "Not connected" otherwise.
7. `backend/` reads credentials from `.env` — the frontend never sees them.
