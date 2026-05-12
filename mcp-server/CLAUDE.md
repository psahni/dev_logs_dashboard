# mcp-server/CLAUDE.md — FastMCP Server Conventions

See root [CLAUDE.md](../CLAUDE.md) for the full project overview.

---

## Framework

- Python FastMCP (latest)
- Package manager: **uv** (never use pip directly)
- The MCP server exposes tools to Claude Code and other MCP clients.
- It communicates with the FastAPI backend via HTTP — it **never** accesses `dev-digest.db`
  directly.

---

## Directory Layout

```
mcp-server/
├── pyproject.toml             ← managed by uv (independent from backend/)
├── uv.lock
└── server.py                  ← FastMCP server entry point
```

---

## Package Management (uv)

```bash
uv add <package>               # add a dependency
uv run python server.py        # run the MCP server
uv sync                        # install from uv.lock
```

`mcp-server/` is an independent Python project. Do not share dependencies with
`backend/` — each has its own `pyproject.toml` and `uv.lock`.

---

## FastMCP Conventions

### Server Setup
- A single `FastMCP` instance is created in `server.py`.
- Tools are registered with the `@mcp.tool()` decorator.
- Each tool function must have a **docstring** — FastMCP uses it as the tool description
  shown to the MCP client.
- Tool parameters must be typed; FastMCP derives the JSON schema from type annotations.

### Tool Registration Pattern
```python
from fastmcp import FastMCP

mcp = FastMCP("dev-digest")

@mcp.tool()
async def get_recent_logs(limit: int = 10) -> list[dict]:
    """Fetch the most recent dev log entries."""
    # calls backend HTTP API, never accesses dev-digest.db directly
    ...
```

### Connecting to the Backend
- Use `httpx` (async) to call the FastAPI backend at `http://localhost:8000`.
- Never import from `backend/` directly — the boundary is always HTTP.
- Store the backend base URL in an environment variable (`BACKEND_URL`), defaulting to
  `http://localhost:8000`.

---

## Startup Command

```bash
cd mcp-server
uv run python server.py
```

The server starts and listens for MCP client connections (stdio or SSE transport,
configured in `server.py`).

---

## What NOT To Do

- Do NOT access `dev-digest.db` directly from this service.
- Do NOT import modules from `backend/`.
- Do NOT use `pip install` — use `uv add`.
- Do NOT mix this project's `pyproject.toml` with `backend/pyproject.toml`.
- Do NOT define new database tables or schema changes here — all schema changes go
  through Drizzle in `frontend/src/db/schema.ts`.
