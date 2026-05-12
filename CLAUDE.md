# Dev Digest — Root CLAUDE.md

Dev Digest is a personal developer dashboard. It ingests your dev logs, git activity,
and notes, then surfaces them as digests, standups, newsletters, and searchable history.

---

## Tech Stack

| Layer       | Technology                                  | Version        |
|-------------|---------------------------------------------|----------------|
| Frontend    | Next.js                                     | 16.2           |
| Language    | TypeScript (strict mode)                    | latest         |
| Styling     | Tailwind CSS                                | v4             |
| Backend     | Python FastAPI                              | 0.115+         |
| ORM         | SQLAlchemy                                  | 2.x            |
| Migrations  | Alembic                                     | latest         |
| Database    | SQLite (single file)                        | —              |
| Python PM   | uv                                          | latest         |
| MCP Server  | Python FastMCP                              | latest         |

The single SQLite database file is located at the repo root: `dev-digest.db`.
It is **only accessed by the FastAPI backend** via SQLAlchemy. The frontend and MCP
server never touch it directly.

---

## Folder Structure

```
dev_logs_app/
├── CLAUDE.md                  ← this file
├── dev-digest.db              ← single SQLite file (gitignored, backend-only)
├── docs/
│   └── specs/                 ← one markdown spec per feature (SDD output)
├── frontend/                  ← Next.js 16.2 app (no DB access)
│   ├── CLAUDE.md
│   └── src/
│       ├── app/               ← Next.js App Router pages and layouts
│       ├── components/        ← shared React components
│       └── lib/               ← API helpers and shared TypeScript types
├── backend/                   ← Python FastAPI service (owns the database)
│   ├── CLAUDE.md
│   ├── alembic.ini
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/          ← auto-generated migration files (commit these)
│   ├── pyproject.toml         ← managed by uv
│   ├── uv.lock
│   └── app/
│       ├── main.py
│       ├── database.py        ← SQLAlchemy engine, Base, get_db() dependency
│       ├── routes/
│       └── models/            ← SQLAlchemy ORM models + Pydantic schemas
├── mcp-server/                ← Python FastMCP server
│   ├── CLAUDE.md
│   ├── pyproject.toml         ← managed by uv (separate venv from backend)
│   ├── uv.lock
│   └── server.py
└── .claude/
    ├── commands/              ← SDD slash command templates
    ├── skills/                ← reusable prompt skill templates
    ├── agents/                ← sub-agent definitions
    └── hooks/                 ← hook documentation
```

---

## Running Each Service

### Next.js Dev Server (frontend)
```bash
cd frontend
npm run dev
```
Runs on http://localhost:3000 by default.

### FastAPI Backend (backend)
```bash
cd backend
uv run uvicorn app.main:app --reload --port 8000
```
Runs on http://localhost:8000. API docs at http://localhost:8000/docs.

### FastMCP Server (mcp-server)
```bash
cd mcp-server
uv run python server.py
```
The MCP server communicates with the FastAPI backend via HTTP. It does not access the
database directly.

Do NOT let the MCP server access dev-digest.db directly — always go through FastAPI at http://localhost:8000

---

## Database Conventions (SQLAlchemy + Alembic)

**The FastAPI backend is the single owner of the database.** No other service reads or
writes `dev-digest.db` directly.

- ORM models are defined in `backend/app/models/` using SQLAlchemy 2.x `DeclarativeBase`.
- `backend/app/database.py` creates the SQLAlchemy engine, the `Base` class, and the
  `get_db()` FastAPI dependency.
- Migrations are managed by **Alembic** — never by hand-editing the database.
- The frontend accesses data exclusively via HTTP calls to the FastAPI backend.
- The MCP server accesses data exclusively via HTTP calls to the FastAPI backend.

### SQLAlchemy Model Pattern
```python
# backend/app/models/<resource>.py
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class MyModel(Base):
    __tablename__ = "my_table"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    # ... other columns
```

### Alembic Migration Workflow
```bash
cd backend
uv run alembic revision --autogenerate -m "description"  # generate migration from models
uv run alembic upgrade head                               # apply all pending migrations
uv run alembic downgrade -1                               # roll back one migration
```

---

## Python Conventions

- Package management: always use `uv`. Never use `pip install` directly, never use Poetry.
- Adding a dependency: `uv add <package>` (inside the relevant subdirectory).
- Running scripts: `uv run <command>` (ensures the correct venv is used).
- `backend/` and `mcp-server/` are independent Python projects, each with their own
  `pyproject.toml` and `uv.lock`. Do not mix their dependencies.
- Pydantic v2 is used for all request/response validation in FastAPI.
- All FastAPI route handlers must have typed request bodies (Pydantic BaseModel) and
  typed response models.

### FastAPI Route Conventions
- Routes are split by domain into `backend/app/routes/` (one file per resource).
- Each route file exports an `APIRouter` instance, mounted in `backend/app/main.py`.
- Route functions are `async def`.
- Use `HTTPException` for error responses — never return raw dicts for errors.

---

## What NOT To Do

- Do NOT access `dev-digest.db` from the frontend — the frontend is a pure HTTP client.
- Do NOT access `dev-digest.db` from the MCP server — it must go through FastAPI's HTTP API.
- Do NOT write raw SQL that bypasses SQLAlchemy — use the ORM.
- Do NOT run `pip install` — use `uv add` instead.
- Do NOT mix `backend/` and `mcp-server/` Python dependencies (they are separate projects).
- Do NOT use the Next.js `pages/` router — this project uses the App Router exclusively.
- Do NOT commit `dev-digest.db` to git.
- Do NOT use Prisma, Drizzle ORM, or any frontend ORM.
- Do NOT import `sqlite3`, `drizzle-orm`, or `better-sqlite3` in the frontend.

---

## SDD (Spec-Driven Development) Workflow

Features are developed through a pipeline of slash commands in `.claude/commands/`:

```
/brainstorm  →  /define  →  /design  →  /tasks  →  /build
```

Each step produces an artifact saved to `docs/specs/`. See `.claude/commands/` for the
full prompt templates.

---

## .claude/ Directory

| Path                              | Purpose                                      |
|-----------------------------------|----------------------------------------------|
| `.claude/commands/`               | SDD slash command templates                  |
| `.claude/skills/`                 | Reusable prompt skill templates              |
| `.claude/agents/researcher.md`    | Sub-agent for web research tasks             |
| `.claude/hooks/pre-commit.md`     | Pre-commit hook documentation                |


## Starting the Full Stack Locally
1. cd frontend && npm run dev                                        (port 3000)
2. cd backend && uv run uvicorn app.main:app --reload --port 8000   (port 8000)
3. cd mcp-server && uv run python server.py
4. claude mcp add dev-digest -- uv run python mcp-server/server.py
