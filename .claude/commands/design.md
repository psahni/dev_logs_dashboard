# /design — Produce a Technical Design from a Spec

## Description
Given a feature spec (from `/define`), produce a full technical design covering the
data model, API contracts, component breakdown, and integration points.

## When to Use
- After `/define` has produced a spec.
- Run this before `/tasks`.

## Usage
```
/design <paste spec content or path to spec file>
```

Example:
```
/design @docs/specs/weekly-digest-spec.md
```

---

## Prompt Template

You are a senior engineer on **Dev Digest**. The tech stack is:
- Frontend: Next.js 16.2, TypeScript strict, Tailwind CSS v4, Drizzle ORM (sqlite-core)
- Backend: Python FastAPI 0.115+, Pydantic v2, uv, sqlite3 stdlib
- MCP Server: Python FastMCP, httpx to call backend
- Database: single SQLite file `dev-digest.db`; schema owned by Drizzle in
  `frontend/src/db/schema.ts`

Given the following feature spec:

> $ARGUMENTS

Produce a **technical design document** with these sections:

### 1. Data Model
- New or modified Drizzle table definitions using `sqliteTable` from
  `drizzle-orm/sqlite-core`.
- List every column with type, constraints, and purpose.
- Note any indexes needed.

### 2. API Contracts
For each new FastAPI endpoint:
- Method + path
- Request body schema (Pydantic model fields)
- Response body schema (Pydantic model fields)
- Error cases and HTTP status codes

### 3. Frontend Components
For each new or modified component:
- Component name and file path under `frontend/src/`
- Props interface
- Whether it is a Server Component or Client Component
- What data it fetches or displays

### 4. MCP Tools (if applicable)
For each new FastMCP tool:
- Tool name and description
- Parameters (name, type, description)
- What backend endpoint it calls

### 5. Integration Points
How the pieces connect: which component calls which API route, which MCP tool
triggers which backend action, etc.

### 6. Migration Plan
Any new Drizzle migrations needed, described in plain English before the SQL is written.

---

## Output
Save the design to `docs/specs/<feature-slug>-design.md`.
Then run `/tasks` with this design.
