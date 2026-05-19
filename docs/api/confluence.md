# API Reference — Confluence

Base URL: `http://localhost:8000`

---

## POST /confluence/publish

Publishes a page to Confluence using the credentials configured in `backend/.env`.

### Request

```
POST /confluence/publish
Content-Type: application/json
```

**Body:**

| Field     | Type   | Required | Description                                      |
|-----------|--------|----------|--------------------------------------------------|
| `title`   | string | yes      | Page title as it will appear in Confluence       |
| `content` | string | yes      | Page body in Confluence wiki markup format       |

**Example:**
```json
{
  "title": "DevPulse Test Page",
  "content": "h1. Hello from DevPulse\n\n* Item one\n* Item two"
}
```

### Response

**200 OK**
```json
{
  "page_url": "https://techleadps.atlassian.net/spaces/~7120202926b2d8aa424ad5aa06cf4bdfe3d83a/pages/720897/DevPulse+Test+Page"
}
```

| Field      | Type   | Description                              |
|------------|--------|------------------------------------------|
| `page_url` | string | Direct URL to the newly created page     |

### Error Responses

| Status | Condition                                         | Body                                                                                          |
|--------|---------------------------------------------------|-----------------------------------------------------------------------------------------------|
| 401    | `CONFLUENCE_API_TOKEN` not set in `.env`          | `{ "detail": "CONFLUENCE_API_TOKEN is not set" }`                                             |
| 400    | Any of `CONFLUENCE_BASE_URL`, `CONFLUENCE_EMAIL`, `CONFLUENCE_SPACE_ID` missing | `{ "detail": "Confluence is not fully configured. Check CONFLUENCE_BASE_URL, CONFLUENCE_EMAIL, CONFLUENCE_SPACE_ID." }` |
| 502    | Atlassian API rejected the request                | `{ "detail": "Confluence API error 400: { ... Atlassian error JSON ... }" }`                  |

---

## GET /confluence/status

Verifies the Confluence connection by making a real API call to Confluence.
Returns `connected: true` only when credentials are present **and** the call succeeds with HTTP 200.

### Request

```
GET /confluence/status
```

No body or parameters.

### Response

**200 OK**
```json
{
  "connected": true
}
```

| Field       | Type    | Description                                                                         |
|-------------|---------|------------------------------------------------------------------------------------|
| `connected` | boolean | `true` only if `GET /wiki/api/v2/spaces?limit=1` returns 200 from Confluence       |

**`connected: false` when:**
- Any of `CONFLUENCE_API_TOKEN`, `CONFLUENCE_BASE_URL`, `CONFLUENCE_EMAIL` is missing
- The token is invalid or expired (Confluence returns 401/403)
- The Confluence host is unreachable (network error or wrong `CONFLUENCE_BASE_URL`)

> This endpoint always returns HTTP 200 itself — the `connected` field carries the result.
> It uses a lightweight ping (`GET /wiki/api/v2/spaces?limit=1`) with a 10s timeout.

---

## Wiki Markup Reference

The `content` field uses **Confluence wiki markup** (not Markdown).

| Element       | Syntax                        |
|---------------|-------------------------------|
| Heading 1     | `h1. Your heading`            |
| Heading 2     | `h2. Your heading`            |
| Bullet list   | `* item`                      |
| Numbered list | `# item`                      |
| Bold          | `*bold text*`                 |
| Italic        | `_italic text_`               |
| Code block    | `{code}...{code}`             |
| Horizontal rule | `----`                      |

The Groq generator (`POST /generate/confluence`) already produces content in this format.

---

## Required Environment Variables

Configured in `backend/.env` (see `backend/.env.example`):

| Variable               | Example value                           | Description                        |
|------------------------|-----------------------------------------|------------------------------------|
| `CONFLUENCE_BASE_URL`  | `https://your-domain.atlassian.net`     | Atlassian domain with `https://`   |
| `CONFLUENCE_EMAIL`     | `you@example.com`                       | Atlassian account email            |
| `CONFLUENCE_API_TOKEN` | `ATATT3x...`                            | API token from id.atlassian.com    |
| `CONFLUENCE_SPACE_ID`  | `163842`                                | Numeric space ID (not the key)     |

> **Note:** `CONFLUENCE_SPACE_ID` must be the **numeric ID**, not the space key (e.g. `~abc123`).
> To find it: `GET /wiki/api/v2/spaces?keys=YOUR_SPACE_KEY` and read the `id` field from the response.
