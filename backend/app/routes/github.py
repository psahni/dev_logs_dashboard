import os
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.github import GitHubCacheItem, GitHubCommitRead, GitHubPRRead
from app.services.github import fetch_commits_from_github, fetch_pulls_from_github

router = APIRouter(prefix="/github", tags=["github"])

_TTL_MINUTES = 15


def _get_credentials() -> tuple[str, str]:
    token = os.environ.get("GITHUB_TOKEN", "")
    username = os.environ.get("GITHUB_USERNAME", "")
    if not token or not username:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            detail="GITHUB_TOKEN and GITHUB_USERNAME must be set in environment",
        )
    return token, username


def _is_cache_fresh(db: Session, item_type: str) -> bool:
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=_TTL_MINUTES)
    row = db.execute(
        select(GitHubCacheItem)
        .where(GitHubCacheItem.type == item_type)
        .where(GitHubCacheItem.fetched_at >= cutoff)
        .limit(1)
    ).scalar_one_or_none()
    return row is not None


def _replace_cache(db: Session, item_type: str, rows: list[dict]) -> list[GitHubCacheItem]:
    db.execute(delete(GitHubCacheItem).where(GitHubCacheItem.type == item_type))
    now = datetime.now(timezone.utc)
    items = []
    for row in rows:
        date_val = row["date"]
        if isinstance(date_val, str):
            date_val = datetime.fromisoformat(date_val.replace("Z", "+00:00"))
        item = GitHubCacheItem(
            type=item_type,
            external_id=row["external_id"],
            repo=row["repo"],
            title=row["title"],
            url=row["url"],
            state=row.get("state"),
            date=date_val,
            fetched_at=now,
        )
        db.add(item)
        items.append(item)
    db.commit()
    for item in items:
        db.refresh(item)
    return items


@router.get("/commits", response_model=list[GitHubCommitRead])
async def get_commits(refresh: bool = False, db: Session = Depends(get_db)) -> list[GitHubCommitRead]:
    token, username = _get_credentials()

    if not refresh and _is_cache_fresh(db, "commit"):
        cached = db.execute(
            select(GitHubCacheItem)
            .where(GitHubCacheItem.type == "commit")
            .order_by(GitHubCacheItem.date.desc())
        ).scalars().all()
        return [GitHubCommitRead.from_cache(item) for item in cached]

    rows = await fetch_commits_from_github(token, username)
    items = _replace_cache(db, "commit", rows)
    return [GitHubCommitRead.from_cache(item) for item in items]


@router.get("/pulls", response_model=list[GitHubPRRead])
async def get_pulls(refresh: bool = False, db: Session = Depends(get_db)) -> list[GitHubPRRead]:
    token, username = _get_credentials()

    if not refresh and _is_cache_fresh(db, "pull_request"):
        cached = db.execute(
            select(GitHubCacheItem)
            .where(GitHubCacheItem.type == "pull_request")
            .order_by(GitHubCacheItem.date.desc())
        ).scalars().all()
        return [GitHubPRRead.from_cache(item) for item in cached]

    rows = await fetch_pulls_from_github(token, username)
    items = _replace_cache(db, "pull_request", rows)
    return [GitHubPRRead.from_cache(item) for item in items]
