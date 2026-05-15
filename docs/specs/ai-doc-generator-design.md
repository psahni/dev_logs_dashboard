# Technical Design — AI Document Generator

**Feature slug:** `ai-doc-generator`
**Spec:** [ai-doc-generator-spec.md](./ai-doc-generator-spec.md)
**Architecture:** Backend calls Groq API via httpx. Frontend is HTTP-only.

---

## 1. Data Model

No new tables required. Generated documents are ephemeral — they are never persisted.

The existing tables queried by the generate endpoints are:

| Table | Used for |
|---|---|
| `logs` | Dev log entries (`title`, `description`, `tags`, `created_at`) |
| `github_cache` | Commits (`type="commit"`) and PRs (`type="pull_request"`) |

Both are queried with a 7-day lookback window using `created_at >= now - 7 days` and
`date >= now - 7 days` respectively.

---

## 2. API Contracts

### POST /generate/confluence

Reads dev logs + GitHub activity from the last 7 days, sends a structured prompt to
Groq, returns the generated Confluence wiki markup.

**Request body:** none (no body required)

**Response — 200 OK:**
```json
{ "content": "h1. Weekly Engineering Summary\n\nh2. Dev Logs\n..." }
```

**Pydantic response model:**
```python
class GenerateResponse(BaseModel):
    content: str
```

**Error cases:**
| Status | Condition |
|---|---|
| 401 | `GROQ_API_KEY` not set in environment |
| 502 | Groq API returned a non-200 response |

**Empty state:** If no logs or GitHub data exist, returns 200 with:
```json
{ "content": "No activity found for the last 7 days." }
```

---

### POST /generate/standup

Same data source. Returns a plain-text daily standup.

**Request body:** none

**Response — 200 OK:**
```json
{ "content": "Yesterday:\n- ...\n\nToday:\n- ...\n\nBlockers:\n- None" }
```

**Pydantic response model:** same `GenerateResponse`

**Error cases:** same as `/generate/confluence`

---

## 3. Backend Implementation

### New file: `backend/app/services/groq.py`

Thin async wrapper around the Groq chat completions API:

```python
async def call_groq(api_key: str, system_prompt: str, user_prompt: str) -> str:
    """Call Groq chat completions and return the response text."""
    async with httpx.AsyncClient(timeout=60.0) as client:
        res = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": 0.3,
            },
        )
    if res.status_code != 200:
        raise HTTPException(502, detail=f"Groq API error: {res.status_code}")
    return res.json()["choices"][0]["message"]["content"]
```

### New file: `backend/app/routes/generate.py`

```
router = APIRouter(prefix="/generate", tags=["generate"])

GET credential helper: reads GROQ_API_KEY from os.environ, raises 401 if missing.

_fetch_context(db) helper:
  - queries Log rows where created_at >= 7 days ago, ordered newest first
  - queries GitHubCacheItem rows where date >= 7 days ago, ordered newest first
  - returns a dict: { logs: [...], commits: [...], pulls: [...] }

_build_confluence_prompt(context) → (system_prompt, user_prompt)
_build_standup_prompt(context) → (system_prompt, user_prompt)

POST /generate/confluence  →  calls _fetch_context, _build_confluence_prompt, call_groq
POST /generate/standup     →  calls _fetch_context, _build_standup_prompt, call_groq
```

### Prompt design

**Confluence system prompt:**
> You are a technical writer. Generate a Confluence wiki markup document summarising
> the developer's work for the past week. Use only the data provided — do not invent
> tasks. Format: h1 title, h2 sections for Dev Logs, Commits, Pull Requests. Use
> wiki markup only (h1., h2., *bold*, * bullets). No Markdown, no HTML.

**Standup system prompt:**
> You are a helpful assistant. Generate a concise daily standup from the developer's
> recent activity. Use only the data provided — do not invent tasks. Output plain text
> only with three sections labelled "Yesterday:", "Today:", and "Blockers:". No Markdown,
> no bullet symbols other than plain dashes.

### Mount in main.py

```python
from app.routes.generate import router as generate_router
app.include_router(generate_router)
```

---

## 4. Frontend Components

### New: `frontend/src/lib/api.ts` additions

```typescript
export async function generateConfluence(): Promise<string>
export async function generateStandup(): Promise<string>
```
Both `POST` to the respective endpoint, return `data.content` string, throw on non-ok.

---

### New: `frontend/src/components/features/GeneratePanel.tsx`

**Type:** Client Component (`"use client"`)

**Props:**
```typescript
type Props = {
  type: "confluence" | "standup"
  label: string        // button label
}
```

**State:**
- `output: string | null` — generated text or null before first generation
- `loading: boolean`
- `error: string | null`
- `copied: boolean` — transient state for copy feedback

**Behaviour:**
1. "Generate" button triggers the matching `api.ts` helper
2. Shows spinner + "Generating…" text while loading
3. On success: renders output in a `<pre>` / `<textarea readonly>` with monospace font
4. "Copy" button calls `navigator.clipboard.writeText(output)`, briefly shows "Copied!"
5. On error: shows error banner

---

### Modified: `frontend/src/components/features/LogDashboard.tsx`

Add a "Generate" toolbar row between the header and the two-column grid:

```tsx
<div className="mb-4 flex gap-3">
  <GeneratePanel type="standup"    label="Generate Standup" />
  <GeneratePanel type="confluence" label="Generate Confluence Doc" />
</div>
```

Each `GeneratePanel` renders its own button + output inline, so both can be open simultaneously without interference.

---

## 5. MCP Tools

Not applicable for this feature. Generation is a user-triggered dashboard action and
does not need to be accessible via Claude Code's MCP tools.

---

## 6. Integration Points

```
User clicks "Generate Standup" button
  → GeneratePanel (Client Component)
    → generateStandup() [api.ts]
      → POST /generate/standup [FastAPI]
        → _fetch_context(db) reads logs + github_cache
        → _build_standup_prompt(context)
        → call_groq(api_key, system, user) [groq.py service]
          → POST https://api.groq.com/openai/v1/chat/completions
        → returns GenerateResponse { content: "..." }
    → GeneratePanel displays content in <pre>, enables Copy button
```

Same flow for "Generate Confluence Doc" → `POST /generate/confluence`.

---

## 6. Migration Plan

No database migrations required. This feature reads existing tables (`logs`,
`github_cache`) and generates ephemeral output. No new columns or tables are added.
