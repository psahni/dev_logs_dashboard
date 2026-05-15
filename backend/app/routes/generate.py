import os
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.github import GitHubCacheItem
from app.models.log import Log
from app.services.groq import call_groq

router = APIRouter(prefix="/generate", tags=["generate"])


class GenerateResponse(BaseModel):
    content: str


def _get_api_key() -> str:
    key = os.environ.get("GROQ_API_KEY", "")
    if not key:
        raise HTTPException(status_code=401, detail="GROQ_API_KEY is not set")
    return key


def _fetch_context(db: Session) -> dict:
    since = datetime.now(timezone.utc) - timedelta(days=7)

    logs = db.execute(
        select(Log).where(Log.created_at >= since).order_by(Log.created_at.desc())
    ).scalars().all()

    commits = db.execute(
        select(GitHubCacheItem)
        .where(GitHubCacheItem.type == "commit")
        .where(GitHubCacheItem.date >= since)
        .order_by(GitHubCacheItem.date.desc())
    ).scalars().all()

    pulls = db.execute(
        select(GitHubCacheItem)
        .where(GitHubCacheItem.type == "pull_request")
        .where(GitHubCacheItem.date >= since)
        .order_by(GitHubCacheItem.date.desc())
    ).scalars().all()

    return {"logs": logs, "commits": commits, "pulls": pulls}


def _build_confluence_prompt(context: dict) -> tuple[str, str]:
    system = (
        "You are a technical writer. Generate a Confluence wiki markup document "
        "summarising the developer's work for the past week. "
        "Use ONLY the data provided — do not invent tasks or activity. "
        "Format rules: use h1. for the main title, h2. for section headings, "
        "*bold* for emphasis, * for bullet list items. "
        "No Markdown, no HTML. Wiki markup only."
    )

    logs_text = "\n".join(
        f"- [{log.created_at.strftime('%Y-%m-%d')}] {log.title}: {log.description}"
        + (f" (tags: {log.tags})" if log.tags else "")
        for log in context["logs"]
    ) or "None"

    commits_text = "\n".join(
        f"- [{c.date.strftime('%Y-%m-%d')}] {c.repo}: {c.title}"
        for c in context["commits"]
    ) or "None"

    pulls_text = "\n".join(
        f"- [{p.date.strftime('%Y-%m-%d')}] {p.repo} #{p.external_id} ({p.state}): {p.title}"
        for p in context["pulls"]
    ) or "None"

    user = f"""Generate a Confluence wiki markup weekly engineering summary from this data:

DEV LOGS (last 7 days):
{logs_text}

GITHUB COMMITS (last 7 days):
{commits_text}

GITHUB PULL REQUESTS (last 7 days):
{pulls_text}

Output wiki markup only. Start with the h1. title."""

    return system, user


def _build_standup_prompt(context: dict) -> tuple[str, str]:
    system = (
        "You are a helpful assistant. Generate a concise daily standup from the "
        "developer's recent activity. Use ONLY the data provided — do not invent tasks. "
        "Output plain text with exactly three sections labelled 'Yesterday:', 'Today:', "
        "and 'Blockers:'. Use dashes for bullet points. No Markdown formatting."
    )

    today = datetime.now(timezone.utc).date()
    yesterday = today - timedelta(days=1)

    today_logs = [l for l in context["logs"] if l.created_at.date() == today]
    yesterday_logs = [l for l in context["logs"] if l.created_at.date() == yesterday]
    recent_logs = context["logs"][:5] if not yesterday_logs and not today_logs else context["logs"]

    logs_text = "\n".join(
        f"- [{log.created_at.strftime('%Y-%m-%d')}] {log.title}: {log.description}"
        for log in recent_logs
    ) or "None"

    commits_text = "\n".join(
        f"- [{c.date.strftime('%Y-%m-%d')}] {c.repo}: {c.title}"
        for c in context["commits"][:10]
    ) or "None"

    pulls_text = "\n".join(
        f"- [{p.date.strftime('%Y-%m-%d')}] {p.repo} #{p.external_id} ({p.state}): {p.title}"
        for p in context["pulls"][:5]
    ) or "None"

    user = f"""Generate a daily standup from this developer activity data:

DEV LOGS:
{logs_text}

RECENT COMMITS:
{commits_text}

PULL REQUESTS:
{pulls_text}

Today's date: {today.isoformat()}

Output three sections: Yesterday, Today, Blockers. Plain text only."""

    return system, user


@router.post("/confluence", response_model=GenerateResponse)
async def generate_confluence(db: Session = Depends(get_db)) -> GenerateResponse:
    api_key = _get_api_key()
    context = _fetch_context(db)

    if not context["logs"] and not context["commits"] and not context["pulls"]:
        return GenerateResponse(content="No activity found for the last 7 days.")

    system, user = _build_confluence_prompt(context)
    content = await call_groq(api_key, system, user)
    return GenerateResponse(content=content)


@router.post("/standup", response_model=GenerateResponse)
async def generate_standup(db: Session = Depends(get_db)) -> GenerateResponse:
    api_key = _get_api_key()
    context = _fetch_context(db)

    if not context["logs"] and not context["commits"] and not context["pulls"]:
        return GenerateResponse(content="No activity found for the last 7 days.")

    system, user = _build_standup_prompt(context)
    content = await call_groq(api_key, system, user)
    return GenerateResponse(content=content)
