# Technical Design — Confluence Publish Integration

**Spec:** `docs/specs/confluence-publish-spec.md`

---

## 1. Environment Variables

Add to `backend/.env` (and `backend/.env.example`):

```
CONFLUENCE_BASE_URL=https://your-domain.atlassian.net
CONFLUENCE_EMAIL=you@example.com
CONFLUENCE_API_TOKEN=your_api_token_here
CONFLUENCE_SPACE_ID=your_space_id_here
```

`CONFLUENCE_SPACE_ID` is the numeric ID of the Confluence space. It can be found
via `GET /wiki/api/v2/spaces` after authenticating.

---

## 2. API Contract

### `POST /confluence/publish`

**Request body** (`PublishRequest`):
```json
{
  "title": "Weekly Engineering Summary — 2026-05-18",
  "content": "h1. Weekly Summary\n\n* Fixed auth bug\n..."
}
```

**Response body** (`PublishResponse`) on success (HTTP 200):
```json
{
  "page_url": "https://your-domain.atlassian.net/wiki/spaces/ENG/pages/123456"
}
```

**Error cases:**
| Condition | HTTP status | Detail |
|---|---|---|
| `CONFLUENCE_API_TOKEN` not set | 401 | "CONFLUENCE_API_TOKEN is not set" |
| Any env var missing | 400 | "Confluence is not fully configured" |
| Atlassian API error | 502 | Atlassian error message forwarded |

---

## 3. Backend — New Files

### `backend/app/services/confluence.py`

Single async function that handles the Confluence API call:

```python
async def publish_page(base_url: str, email: str, token: str,
                       space_id: str, title: str, content: str) -> str:
    # POST /wiki/api/v2/pages
    # Auth: Basic base64(email:token)
    # Body: { spaceId, title, body: { representation: "wiki", value: content }, status: "current" }
    # Returns: page URL constructed from response["_links"]["webui"]
```

Uses `httpx.AsyncClient` (already a dependency). Returns the URL of the created page.

### `backend/app/routes/confluence.py`

```python
router = APIRouter(prefix="/confluence", tags=["confluence"])

class PublishRequest(BaseModel):
    title: str
    content: str

class PublishResponse(BaseModel):
    page_url: str

@router.post("/publish", response_model=PublishResponse)
async def publish_to_confluence(body: PublishRequest) -> PublishResponse:
    # reads env vars, calls confluence service, returns page_url
```

---

## 4. Backend — Modified Files

### `backend/app/main.py`

Mount the new router:
```python
from app.routes.confluence import router as confluence_router
app.include_router(confluence_router)
```

### `backend/.env.example`

Add the four new Confluence variables (empty values, no secrets).

---

## 5. Frontend — Modified Files

### `frontend/src/lib/api.ts`

Add one new fetch helper:
```typescript
export async function publishToConfluence(title: string, content: string): Promise<{ page_url: string }> {
  const res = await fetch(`${BASE}/confluence/publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
```

### `frontend/src/components/views/ConfluenceView.tsx`

Add a "Publish to Confluence" button below the generated output:

```
[ Generate ]         ← existing
[ Copy ]             ← existing
[ Publish to Confluence ]  ← new, disabled until output exists
```

State additions:
- `publishing: boolean` (via `useTransition`)
- `pageUrl: string | null` — set on success, renders a link

### `frontend/src/components/views/SettingsView.tsx`

The connected/not-connected status for Confluence is currently hardcoded. Add a new
backend endpoint `GET /confluence/status` that returns `{ connected: bool }`, and
fetch it server-side in `app/settings/page.tsx` to drive the chip dynamically.

---

## 6. New Backend Endpoint for Settings Status

### `GET /confluence/status`

Returns whether the Confluence integration is configured:

```json
{ "connected": true }
```

No auth required — just checks whether env vars are present. Also add equivalent
`GET /groq/status` and `GET /github/status` while at it, so the Settings page is
fully dynamic (currently all hardcoded).

---

## 7. Integration Flow

```
ConfluenceView (client)
  → "Publish" button clicked
  → publishToConfluence(title, output) [api.ts]
  → POST /confluence/publish [FastAPI]
  → confluence.publish_page() [service]
  → POST https://{base_url}/wiki/api/v2/pages [Atlassian Cloud]
  ← { id, _links: { webui: "/wiki/spaces/..." } }
  ← page_url constructed and returned
  → ConfluenceView shows link to new page
```

---

## 8. Confluence API Reference

**Endpoint:** `POST {base_url}/wiki/api/v2/pages`

**Headers:**
```
Authorization: Basic <base64(email:token)>
Content-Type: application/json
```

**Body:**
```json
{
  "spaceId": "123456",
  "status": "current",
  "title": "Weekly Engineering Summary",
  "body": {
    "representation": "wiki",
    "value": "h1. Summary\n\n* item one"
  }
}
```

**Response** (201 Created):
```json
{
  "id": "789",
  "_links": {
    "webui": "/wiki/spaces/ENG/pages/789/Weekly+Engineering+Summary"
  }
}
```

The full page URL is: `{base_url}{_links.webui}`
