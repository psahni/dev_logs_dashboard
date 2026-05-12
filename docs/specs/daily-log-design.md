# Technical Design — Daily Dev Log

**Feature slug:** `daily-log`  
**Spec:** [daily-log-spec.md](./daily-log-spec.md)  
**Status:** Approved  
**Architecture:** Backend owns schema (SQLAlchemy + Alembic). Frontend is HTTP-only.

---

## 1. Data Model

**New SQLAlchemy model: `Log`**

```python
# backend/app/models/log.py
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Index
from datetime import datetime, timezone
from app.database import Base

class Log(Base):
    __tablename__ = "logs"

    id:          Mapped[int]      = mapped_column(primary_key=True, autoincrement=True)
    title:       Mapped[str]      = mapped_column(nullable=False)
    description: Mapped[str]      = mapped_column(nullable=False)
    tags:        Mapped[str]      = mapped_column(nullable=False, default="")
    created_at:  Mapped[datetime] = mapped_column(
        nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    __table_args__ = (
        Index("logs_created_at_idx", "created_at"),
    )
```

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| `id` | Integer | PK, autoincrement | Unique row identifier |
| `title` | String | NOT NULL | Short summary of the day's work |
| `description` | String | NOT NULL | Full description of what was done |
| `tags` | String | NOT NULL, default `""` | Comma-separated tags, e.g. `"fastapi,sqlalchemy"` |
| `created_at` | DateTime | NOT NULL, UTC | Set at insertion time; drives list ordering |

**Index:** `logs_created_at_idx` on `created_at` for efficient `ORDER BY created_at DESC`.

---

## 2. API Contracts

### `POST /logs`
Creates a new log entry.

**Request body** (`LogCreate`):
```python
class LogCreate(BaseModel):
    title: str        # required, non-empty
    description: str  # required, non-empty
    tags: str = ""    # optional, comma-separated
```

**Response 201** (`LogRead`):
```python
class LogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    description: str
    tags: str
    created_at: datetime
```

**Errors:**
| Status | Condition |
|---|---|
| 422 | `title` or `description` missing or empty string |

---

### `GET /logs`
Returns all log entries ordered newest-first.

**Request:** No body, no query params.  
**Response 200:** `list[LogRead]` — empty list `[]` when no entries exist. Never a 404.

---

## 3. Frontend Components

```
app/
└── page.tsx                           ← Server Component (fetches GET /logs)

components/
├── features/
│   ├── LogDashboard.tsx               ← Client Component (state owner)
│   ├── NewLogModal.tsx                ← Client Component (form + POST /logs)
│   ├── LogList.tsx                    ← Presentational (renders cards)
│   └── LogCard.tsx                    ← Presentational (single entry)
└── ui/
    └── TagChip.tsx                    ← Presentational (single tag badge)

lib/
├── types.ts                           ← LogEntry TypeScript type
└── api.ts                             ← getLogs() and createLog() fetch wrappers
```

---

**`app/page.tsx`** — Server Component
- Calls `getLogs()` server-side at request time (no client-side loading spinner)
- Renders `<LogDashboard initialLogs={logs} />`

---

**`components/features/LogDashboard.tsx`** — Client Component (`'use client'`)
```typescript
type Props = { initialLogs: LogEntry[] }
// State: logs (LogEntry[]), isModalOpen (boolean)
// Renders: header, "New Log" button, <LogList>, <NewLogModal>
// onLogCreated(newLog): prepend newLog to logs state
```

---

**`components/features/NewLogModal.tsx`** — Client Component (`'use client'`)
```typescript
type Props = {
  isOpen: boolean
  onClose: () => void
  onSuccess: (created: LogEntry) => void
}
// State: title, description, tags, isSubmitting, error
// On submit: POST /logs via lib/api.createLog()
//   success → onSuccess(created), reset form, onClose()
//   failure → show inline error, keep modal open
// Validation: title and description must be non-empty before submitting
```

---

**`components/features/LogList.tsx`** — Presentational
```typescript
type Props = { logs: LogEntry[] }
// Renders list of <LogCard>; empty state when logs.length === 0
```

---

**`components/features/LogCard.tsx`** — Presentational
```typescript
type Props = { log: LogEntry }
// Renders: title, formatted date, description, <TagChip> per tag
// Tags: split log.tags on ',', filter empty strings
```

---

**`components/ui/TagChip.tsx`** — Presentational
```typescript
type Props = { tag: string }
// Tailwind pill: bg-blue-100 text-blue-800 rounded-full px-2 py-0.5 text-xs
```

---

**`lib/types.ts`**
```typescript
export type LogEntry = {
  id: number
  title: string
  description: string
  tags: string
  created_at: string  // ISO 8601 string from JSON serialisation
}
```

**`lib/api.ts`**
```typescript
const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
export async function getLogs(): Promise<LogEntry[]>
export async function createLog(payload: { title: string; description: string; tags: string }): Promise<LogEntry>
```

---

## 4. MCP Tools

**`create_log`**
- Description: Create a new dev log entry in Dev Digest.
- Parameters: `title: str`, `description: str`, `tags: str = ""`
- Calls: `POST http://localhost:8000/logs`
- Returns: created `LogRead` object

**`get_logs`**
- Description: Retrieve all dev log entries, newest first.
- Parameters: none
- Calls: `GET http://localhost:8000/logs`
- Returns: list of `LogRead` objects

---

## 5. Integration Points

```
VIEW LOGS
─────────
Browser → GET /  →  page.tsx (Server Component)
page.tsx → lib/api.getLogs() → fetch GET :8000/logs
FastAPI  → SQLAlchemy: session.execute(select(Log).order_by(Log.created_at.desc()))
page.tsx → <LogDashboard initialLogs={...} />
LogDashboard → LogList → LogCard × N → TagChip × N

CREATE LOG
──────────
"New Log" click  →  LogDashboard: isModalOpen = true
NewLogModal renders form
Submit  →  lib/api.createLog(...)  →  POST :8000/logs
FastAPI  →  SQLAlchemy: session.add(Log(...)), session.commit()  →  returns LogRead (201)
onSuccess(created)  →  LogDashboard prepends to logs state  →  modal closes
LogList re-renders with new entry at top

MCP
───
create_log(title, description, tags)
  → httpx.post("http://localhost:8000/logs", json={...})
  → same FastAPI path

get_logs()
  → httpx.get("http://localhost:8000/logs")
  → same FastAPI path
```

---

## 6. Migration Plan

One new Alembic migration — additive, no existing tables touched:

1. Define the `Log` SQLAlchemy model in `backend/app/models/log.py`.
2. Ensure `backend/alembic/env.py` imports `Base` from `app.database` so autogenerate detects the model.
3. Run:
```bash
cd backend
uv run alembic revision --autogenerate -m "create logs table"
uv run alembic upgrade head
```
4. Verify `dev-digest.db` contains the `logs` table with all five columns and the index.
