import httpx
from fastapi import HTTPException


async def call_groq(api_key: str, system_prompt: str, user_prompt: str) -> str:
    async with httpx.AsyncClient(timeout=60.0) as client:
        res = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": 0.3,
            },
        )
    if res.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Groq API error: {res.status_code} {res.text}")
    return res.json()["choices"][0]["message"]["content"]
