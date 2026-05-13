import os
import httpx
from fastmcp import FastMCP

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000")

mcp = FastMCP("dev-digest")


@mcp.tool()
async def create_log(title: str, description: str, tags: str = "") -> dict:
    """Create a new dev log entry with a title, description, and optional comma-separated tags."""
    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{BACKEND_URL}/logs",
            json={"title": title, "description": description, "tags": tags},
        )
        res.raise_for_status()
        return res.json()


@mcp.tool()
async def get_logs() -> list[dict]:
    """Fetch all dev log entries ordered by date, newest first."""
    async with httpx.AsyncClient() as client:
        res = await client.get(f"{BACKEND_URL}/logs")
        res.raise_for_status()
        return res.json()


@mcp.tool()
async def get_github_commits(refresh: bool = False) -> list[dict]:
    """Fetch recent GitHub commits for the configured user (last 7 days). Pass refresh=True to bypass the 15-minute cache."""
    url = f"{BACKEND_URL}/github/commits"
    if refresh:
        url += "?refresh=true"
    async with httpx.AsyncClient() as client:
        res = await client.get(url)
        res.raise_for_status()
        return res.json()


@mcp.tool()
async def get_github_pulls(refresh: bool = False) -> list[dict]:
    """Fetch recent GitHub pull requests for the configured user (last 7 days). Pass refresh=True to bypass the 15-minute cache."""
    url = f"{BACKEND_URL}/github/pulls"
    if refresh:
        url += "?refresh=true"
    async with httpx.AsyncClient() as client:
        res = await client.get(url)
        res.raise_for_status()
        return res.json()


if __name__ == "__main__":
    mcp.run()
