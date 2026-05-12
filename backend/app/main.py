from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.logs import router as logs_router

app = FastAPI(title="Dev Digest API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(logs_router)
