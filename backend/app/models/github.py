from datetime import datetime, timezone

from pydantic import BaseModel
from sqlalchemy import Index
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class GitHubCacheItem(Base):
    __tablename__ = "github_cache"

    id:          Mapped[int]           = mapped_column(primary_key=True, autoincrement=True)
    type:        Mapped[str]           = mapped_column(nullable=False)   # "commit" | "pull_request"
    external_id: Mapped[str]           = mapped_column(nullable=False)   # sha or PR number as str
    repo:        Mapped[str]           = mapped_column(nullable=False)   # "owner/repo"
    title:       Mapped[str]           = mapped_column(nullable=False)   # commit message or PR title
    url:         Mapped[str]           = mapped_column(nullable=False)   # GitHub HTML URL
    state:       Mapped[str | None]    = mapped_column(nullable=True)    # None for commits; "open"|"merged" for PRs
    date:        Mapped[datetime]      = mapped_column(nullable=False)   # commit date or PR created_at
    fetched_at:  Mapped[datetime]      = mapped_column(
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (
        Index("github_cache_type_fetched_idx", "type", "fetched_at"),
    )


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------


class GitHubCommitRead(BaseModel):
    sha:     str       # stored as external_id in GitHubCacheItem
    message: str       # stored as title in GitHubCacheItem
    repo:    str
    url:     str
    date:    datetime

    @classmethod
    def from_cache(cls, item: "GitHubCacheItem") -> "GitHubCommitRead":
        return cls(sha=item.external_id, message=item.title, repo=item.repo, url=item.url, date=item.date)


class GitHubPRRead(BaseModel):
    number: int        # stored as external_id (str) in GitHubCacheItem
    title:  str
    repo:   str
    url:    str
    state:  str
    date:   datetime

    @classmethod
    def from_cache(cls, item: "GitHubCacheItem") -> "GitHubPRRead":
        return cls(number=int(item.external_id), title=item.title, repo=item.repo, url=item.url, state=item.state or "", date=item.date)
