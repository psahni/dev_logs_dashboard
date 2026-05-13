from datetime import datetime, timedelta, timezone

import httpx
from fastapi import HTTPException, status

_GITHUB_API = "https://api.github.com"
_HEADERS = {
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
}


def _since_iso() -> str:
    """ISO date string for 7 days ago, used in GitHub search queries."""
    since = datetime.now(timezone.utc) - timedelta(days=7)
    return since.strftime("%Y-%m-%d")


def _auth_headers(token: str) -> dict:
    return {**_HEADERS, "Authorization": f"Bearer {token}"}


async def fetch_commits_from_github(token: str, username: str) -> list[dict]:
    """
    Call GitHub Search API for commits authored by `username` in the last 7 days.
    Returns a list of dicts ready to insert into github_cache.
    Raises HTTPException 401 on auth failure, 502 on any other GitHub error.
    """
    query = f"author:{username} committer-date:>={_since_iso()}"
    url = f"{_GITHUB_API}/search/commits"

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            url,
            params={"q": query, "per_page": 100, "sort": "committer-date", "order": "desc"},
            headers=_auth_headers(token),
            timeout=10,
        )

    if resp.status_code == 401:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid or missing GITHUB_TOKEN")
    if not resp.status_code == 200:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, detail=f"GitHub API error: {resp.status_code}")

    items = resp.json().get("items", [])
    result = []
    for item in items:
        commit = item.get("commit", {})
        result.append({
            "type":        "commit",
            "external_id": item["sha"],
            "repo":        item.get("repository", {}).get("full_name", ""),
            "title":       commit.get("message", "").split("\n")[0],  # first line only
            "url":         item.get("html_url", ""),
            "state":       None,
            "date":        commit.get("committer", {}).get("date") or commit.get("author", {}).get("date"),
        })
    return result


async def fetch_pulls_from_github(token: str, username: str) -> list[dict]:
    """
    Call GitHub Search API for PRs opened or merged by `username` in the last 7 days.
    Returns a list of dicts ready to insert into github_cache.
    Raises HTTPException 401 on auth failure, 502 on any other GitHub error.
    """
    query = f"type:pr author:{username} created:>={_since_iso()}"
    url = f"{_GITHUB_API}/search/issues"

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            url,
            params={"q": query, "per_page": 100, "sort": "created", "order": "desc"},
            headers=_auth_headers(token),
            timeout=10,
        )

    if resp.status_code == 401:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid or missing GITHUB_TOKEN")
    if not resp.status_code == 200:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, detail=f"GitHub API error: {resp.status_code}")

    items = resp.json().get("items", [])
    result = []
    for item in items:
        pr_meta = item.get("pull_request", {})
        # derive repo from repository_url: "https://api.github.com/repos/owner/repo"
        repo_url = item.get("repository_url", "")
        repo = "/".join(repo_url.split("/")[-2:]) if repo_url else ""
        state = "merged" if pr_meta.get("merged_at") else "open"
        result.append({
            "type":        "pull_request",
            "external_id": str(item["number"]),
            "repo":        repo,
            "title":       item.get("title", ""),
            "url":         item.get("html_url", ""),
            "state":       state,
            "date":        item.get("created_at"),
        })
    return result
