# Using Dev Digest with Claude Code (MCP)

The MCP server lets Claude Code create and retrieve your dev logs through natural
language — no browser needed. Just describe what you worked on and Claude logs it for you.

---

## Setup

### 1. Start the FastAPI backend

```bash
cd backend
uv run uvicorn app.main:app --reload --port 8000
```

### 2. Register the MCP server with Claude Code

Run this once from the repo root:

```bash
claude mcp add dev-digest -- uv --directory mcp-server run python server.py
```

Verify it was registered:

```bash
claude mcp list
```

You should see `dev-digest` in the list.

### 3. Start a Claude Code session

```bash
claude
```

Claude now has access to the `create_log` and `get_logs` tools automatically.

---

## Example Prompts

### Example 1 — Log what you worked on today

> **You:** Log that today I refactored the authentication middleware to use JWT tokens
> instead of session cookies. Tags: backend, auth, refactor.

Claude will call `create_log` with the title, description, and tags derived from your
message and confirm the entry was saved.

---

### Example 2 — Quick one-liner log

> **You:** Add a dev log: fixed the null pointer bug in the user profile API.

Claude creates a concise log entry, inferring a title and using your message as the
description. You can leave tags out — they're optional.

---

### Example 3 — View recent logs

> **You:** Show me my recent dev logs.

Claude calls `get_logs` and formats the results as a readable list with titles, dates,
and tags.

---

### Example 4 — End-of-day summary log

> **You:** It's end of day. Log my work: I built the NewLogModal React component with
> controlled form fields, client-side validation, and a loading state. Also fixed a
> CORS issue in the FastAPI backend. Tags: frontend, react, backend, bugfix.

Claude splits this into one detailed log entry (or asks if you'd like two separate
entries) and saves it via `create_log`.

---

### Example 5 — Review and log in one go

> **You:** What did I log this week? Then add a new entry: today I wrote unit tests
> for the logs API router covering POST and GET endpoints. Tags: testing, backend.

Claude first calls `get_logs` and summarises this week's entries, then calls
`create_log` to add the new entry — two tools, one prompt.

---

## Tips

- **Tags are optional** — you can always add them or leave them out.
- **Claude infers the title** — if you don't give an explicit title, Claude will derive
  a short one from your description.
- **The backend must be running** — if Claude reports a connection error, check that
  `uvicorn` is running on port 8000.
- **Set a custom backend URL** — if your backend runs on a different port or host, set
  the env var before starting the MCP server:
  ```bash
  BACKEND_URL=http://localhost:9000 uv run python mcp-server/server.py
  ```
