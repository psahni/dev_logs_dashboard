import os

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.confluence import ping, publish_page

router = APIRouter(prefix="/confluence", tags=["confluence"])


class PublishRequest(BaseModel):
    title: str
    content: str


class PublishResponse(BaseModel):
    page_url: str


class StatusResponse(BaseModel):
    connected: bool


def _get_config() -> tuple[str, str, str, str]:
    token = os.environ.get("CONFLUENCE_API_TOKEN", "")
    if not token:
        raise HTTPException(status_code=401, detail="CONFLUENCE_API_TOKEN is not set")

    base_url = os.environ.get("CONFLUENCE_BASE_URL", "")
    email = os.environ.get("CONFLUENCE_EMAIL", "")
    space_id = os.environ.get("CONFLUENCE_SPACE_ID", "")

    if not all([base_url, email, space_id]):
        raise HTTPException(
            status_code=400,
            detail="Confluence is not fully configured. Check CONFLUENCE_BASE_URL, CONFLUENCE_EMAIL, CONFLUENCE_SPACE_ID.",
        )

    return base_url, email, token, space_id


@router.post("/publish", response_model=PublishResponse)
async def publish_to_confluence(body: PublishRequest) -> PublishResponse:
    base_url, email, token, space_id = _get_config()
    page_url = await publish_page(
        base_url=base_url,
        email=email,
        token=token,
        space_id=space_id,
        title=body.title,
        content=body.content,
    )
    return PublishResponse(page_url=page_url)


@router.get("/status", response_model=StatusResponse)
async def confluence_status() -> StatusResponse:
    token = os.environ.get("CONFLUENCE_API_TOKEN", "")
    base_url = os.environ.get("CONFLUENCE_BASE_URL", "")
    email = os.environ.get("CONFLUENCE_EMAIL", "")
    if not all([token, base_url, email]):
        return StatusResponse(connected=False)
    connected = await ping(base_url, email, token)
    return StatusResponse(connected=connected)
