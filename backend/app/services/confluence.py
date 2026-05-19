import base64

import httpx
from fastapi import HTTPException


def _auth_header(email: str, token: str) -> str:
    credentials = base64.b64encode(f"{email}:{token}".encode()).decode()
    return f"Basic {credentials}"


async def ping(base_url: str, email: str, token: str) -> bool:
    headers = {"Authorization": _auth_header(email, token)}
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(
                f"{base_url.rstrip('/')}/wiki/api/v2/spaces?limit=1",
                headers=headers,
            )
        return res.status_code == 200
    except Exception:
        return False


async def publish_page(
    base_url: str,
    email: str,
    token: str,
    space_id: str,
    title: str,
    content: str,
) -> str:
    headers = {
        "Authorization": _auth_header(email, token),
        "Content-Type": "application/json",
    }
    payload = {
        "spaceId": space_id,
        "status": "current",
        "title": title,
        "body": {
            "representation": "wiki",
            "value": content,
        },
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.post(
            f"{base_url.rstrip('/')}/wiki/api/v2/pages",
            headers=headers,
            json=payload,
        )

    if res.status_code not in (200, 201):
        raise HTTPException(
            status_code=502,
            detail=f"Confluence API error {res.status_code}: {res.text}",
        )

    data = res.json()
    web_ui = data.get("_links", {}).get("webui", "")
    return f"{base_url.rstrip('/')}{web_ui}"
