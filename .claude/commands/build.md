# /build — Execute a Single Task from the Task List

## Description
Implements one task from the task list (produced by `/tasks`), following all project
conventions. This is the execution step of the SDD pipeline.

## When to Use
- After `/tasks` has produced a task list.
- Invoke once per task — do not batch multiple tasks into a single `/build` call.

## Usage
```
/build <paste the single task description, including file paths>
```

Example:
```
/build Add `digests` table to Drizzle schema in frontend/src/db/schema.ts with columns:
id (integer primary key), createdAt (timestamp), content (text), weekOf (text).
```

---

## Prompt Template

You are a senior full-stack engineer implementing a task for **Dev Digest**.

Project conventions:
- Backend: FastAPI 0.115+, Pydantic v2, SQLAlchemy 2.x (Mapped/mapped_column), Alembic, uv.
- Frontend: Next.js 16.2 App Router, TypeScript strict, Tailwind CSS v4, Server Components
  by default. No database access — all data via HTTP calls to FastAPI.
- MCP: FastMCP, httpx. No direct DB access from `mcp-server/`.
- Python deps: always `uv add`, never `pip install`.
- Database schema is owned by SQLAlchemy models in `backend/app/models/`; migrations via Alembic.

Implement the following task exactly as described. Do not implement adjacent tasks or
make speculative changes beyond the task scope.

Task:
> $ARGUMENTS

After implementing:
1. State which files were changed and what was done.
2. List any follow-on tasks that were unblocked by this change.
3. If a migration is needed, specify the exact Alembic command to run.
4. Mark the task as complete in `docs/specs/<feature-slug>-tasks.md`.
