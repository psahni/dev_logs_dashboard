from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.log import Log, LogCreate, LogRead

router = APIRouter(prefix="/logs", tags=["logs"])


@router.post("", response_model=LogRead, status_code=status.HTTP_201_CREATED)
async def create_log(payload: LogCreate, db: Session = Depends(get_db)) -> Log:
    if not payload.title.strip():
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, detail="title cannot be empty")
    if not payload.description.strip():
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, detail="description cannot be empty")

    log = Log(
        title=payload.title.strip(),
        description=payload.description.strip(),
        tags=payload.tags.strip(),
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("", response_model=list[LogRead])
async def list_logs(db: Session = Depends(get_db)) -> list[Log]:
    return db.execute(select(Log).order_by(Log.created_at.desc())).scalars().all()
