# Task List — Daily Dev Log

**Feature slug:** `daily-log`  
**Design:** [daily-log-design.md](./daily-log-design.md)  
**Spec:** [daily-log-spec.md](./daily-log-spec.md)  
**Architecture:** Backend owns schema (SQLAlchemy + Alembic). Frontend is HTTP-only.

Execute tasks one by one using `/build`. Do not start a task until all tasks above it are complete.

---

## Backend

- [x] **Scaffold the FastAPI uv project**
  `backend/pyproject.toml`, `backend/app/__init__.py`, `backend/app/models/__init__.py`, `backend/app/routes/__init__.py`
  Run `uv init` in `backend/`; add `fastapi`, `uvicorn`, `sqlalchemy`, `alembic` via `uv add`; create all `__init__.py` files so Python imports resolve.

- [x] **Create `backend/app/database.py`**
  `backend/app/database.py`
  Define the SQLAlchemy engine (`sqlite:///../dev-digest.db`), `Base = DeclarativeBase()`, `SessionLocal`, and the `get_db()` FastAPI dependency that yields a `Session` and closes on teardown.

- [x] **Define the `Log` SQLAlchemy ORM model**
  `backend/app/models/log.py`
  Create the `Log` class inheriting from `Base` with columns: `id` (PK, autoincrement), `title` (str, not null), `description` (str, not null), `tags` (str, not null, default `""`), `created_at` (datetime, UTC, not null); add `logs_created_at_idx` index.

- [x] **Initialise Alembic and configure env.py**
  `backend/alembic.ini`, `backend/alembic/env.py`, `backend/alembic/versions/`
  Run `uv run alembic init alembic`; edit `alembic.ini` to set `sqlalchemy.url = sqlite:///../dev-digest.db`; edit `alembic/env.py` to import `Base` from `app.database` so autogenerate detects all models.

- [x] **Generate and apply the first Alembic migration**
  `backend/alembic/versions/<hash>_create_logs_table.py`, `dev-digest.db`
  Run `uv run alembic revision --autogenerate -m "create logs table"` then `uv run alembic upgrade head`; verify the `logs` table exists in `dev-digest.db`.

- [x] **Write the Pydantic schemas**
  `backend/app/models/log.py`
  Add `LogCreate` (title, description, tags default `""`) and `LogRead` (id, title, description, tags, created_at) using Pydantic v2 `ConfigDict(from_attributes=True)` on `LogRead`.

- [x] **Write the logs API router**
  `backend/app/routes/logs.py`
  Implement `POST /logs` (insert `Log`, commit, return 201 + `LogRead`) and `GET /logs` (select all `Log` ordered by `created_at` desc, return `list[LogRead]`); inject `db: Session = Depends(get_db)`; use `HTTPException` for errors.

- [x] **Wire up the FastAPI app entry point**
  `backend/app/main.py`
  Instantiate `FastAPI()`, include the logs router with `app.include_router`; verify `uv run uvicorn app.main:app --reload --port 8000` starts and `GET /docs` loads without error.

---

## Frontend

- [x] **Scaffold the Next.js project**
  `frontend/package.json`, `frontend/tsconfig.json`, `frontend/next.config.ts`, `frontend/tailwind.config.ts`, `frontend/src/app/layout.tsx`
  Initialise Next.js 16.2 with TypeScript strict and Tailwind CSS v4; do NOT add drizzle-orm or better-sqlite3; create the root layout with global Tailwind styles.

- [x] **Write the shared `LogEntry` type**
  `frontend/src/lib/types.ts`
  Export `LogEntry` with fields `id`, `title`, `description`, `tags`, `created_at` (string); imported by every component and API helper.

- [x] **Write the API fetch helpers**
  `frontend/src/lib/api.ts`
  Implement `getLogs()` and `createLog()`; base URL from `NEXT_PUBLIC_API_URL` defaulting to `http://localhost:8000`; throw on non-ok responses; return typed `LogEntry` or `LogEntry[]`.

- [x] **Build the `TagChip` UI component**
  `frontend/src/components/ui/TagChip.tsx`
  Render a single Tailwind pill badge; accept `{ tag: string }` props; no state.

- [x] **Build the `LogCard` component**
  `frontend/src/components/features/LogCard.tsx`
  Render title, formatted date, description, and a row of `<TagChip>` elements; split `log.tags` on `','`, filter empty strings; accept `{ log: LogEntry }` props.

- [x] **Build the `LogList` component**
  `frontend/src/components/features/LogList.tsx`
  Render an ordered list of `<LogCard>` components; show empty-state message when `logs.length === 0`; accept `{ logs: LogEntry[] }` props.

- [x] **Build the `NewLogModal` component**
  `frontend/src/components/features/NewLogModal.tsx`
  Client Component with controlled form fields (title, description, tags), client-side required validation, calls `createLog()` on submit, calls `onSuccess(created)` then `onClose()` on success, displays inline error on failure; plain `<textarea>` for description.

- [x] **Build the `LogDashboard` component**
  `frontend/src/components/features/LogDashboard.tsx`
  Client Component owning `logs` state (initialised from `initialLogs`) and `isModalOpen` boolean; renders header, "New Log" button, `<LogList>`, and `<NewLogModal>`; `onLogCreated` prepends the new entry to state.

- [x] **Build the dashboard page**
  `frontend/src/app/page.tsx`
  Server Component; calls `getLogs()` server-side at request time; passes result to `<LogDashboard initialLogs={logs} />`; this is the app's only route.

---

## MCP

- [x] **Scaffold the MCP server project**
  `mcp-server/pyproject.toml`, `mcp-server/server.py`
  Run `uv init` in `mcp-server/`; add `fastmcp` and `httpx` via `uv add`; create the `FastMCP("dev-digest")` instance in `server.py`.

- [x] **Implement `create_log` and `get_logs` MCP tools**
  `mcp-server/server.py`
  Add `@mcp.tool()` async functions: `create_log(title, description, tags="")` calling `POST :8000/logs` and `get_logs()` calling `GET :8000/logs`; use `httpx.AsyncClient`; read base URL from `BACKEND_URL` env var defaulting to `http://localhost:8000`.

---

## Docs

- [ ] **Mark task list complete**
  `docs/specs/daily-log-tasks.md`
  Check off each task as it is completed using `/build`.
