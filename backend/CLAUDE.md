# backend/CLAUDE.md — FastAPI Backend Conventions

See root [CLAUDE.md](../CLAUDE.md) for the full project overview.

---

## Framework and Runtime

- Python FastAPI 0.115+
- Package manager: **uv** (never use pip directly)
- ASGI server: uvicorn
- ORM: **SQLAlchemy 2.x** (DeclarativeBase pattern)
- Migrations: **Alembic**
- Validation: Pydantic v2
- Database: SQLite via SQLAlchemy, file at `../dev-digest.db`

The backend is the **sole owner of the database**. The frontend and MCP server access
data only through this service's HTTP API.

---

## Directory Layout

```
backend/
├── alembic.ini                ← Alembic configuration
├── alembic/
│   ├── env.py                 ← imports Base so autogenerate works
│   └── versions/              ← auto-generated migration files (commit these)
├── pyproject.toml             ← managed by uv
├── uv.lock                    ← lockfile (commit this)
└── app/
    ├── main.py                ← FastAPI app instantiation, router mounts, lifespan
    ├── database.py            ← engine, Base, SessionLocal, get_db() dependency
    ├── routes/
    │   └── <resource>.py      ← one file per REST resource, exports APIRouter
    └── models/
        └── <resource>.py      ← SQLAlchemy ORM model + Pydantic request/response schemas
```

---

## Package Management (uv)

```bash
uv add <package>                                          # add a runtime dependency
uv add --dev <package>                                    # add a dev dependency
uv run uvicorn app.main:app --reload --port 8000          # run the server
uv run pytest                                             # run tests
uv sync                                                   # install all deps from uv.lock
```

`backend/` is an independent Python project. Do not install packages here that belong
to `mcp-server/`, and vice versa.

---

## SQLAlchemy Conventions

### database.py pattern
```python
# backend/app/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session
from typing import Generator

DATABASE_URL = "sqlite:///../dev-digest.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)

class Base(DeclarativeBase):
    pass

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### ORM Model pattern (SQLAlchemy 2.x)
```python
# backend/app/models/<resource>.py
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime, timezone
from app.database import Base

class MyModel(Base):
    __tablename__ = "my_table"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        nullable=False, default=lambda: datetime.now(timezone.utc)
    )
```

- Use `Mapped[T]` + `mapped_column()` syntax (SQLAlchemy 2.x) — not the legacy `Column()` style.
- All models inherit from `Base` imported from `app.database`.
- Index declaration: `mapped_column(index=True)` or `__table_args__ = (Index(...),)`.

---

## Alembic Migration Workflow

```bash
cd backend
uv run alembic revision --autogenerate -m "create logs table"  # generate migration
uv run alembic upgrade head                                      # apply all pending
uv run alembic downgrade -1                                      # rollback one step
uv run alembic history                                           # view migration history
```

After adding or modifying a SQLAlchemy model, always run `alembic revision --autogenerate`
to generate the migration, then `alembic upgrade head` to apply it. Never edit
`dev-digest.db` by hand.

---

## FastAPI Conventions

### Route Files
- Each resource (e.g. `logs`, `digests`) gets its own file in `app/routes/`.
- Each file defines an `APIRouter` with a `prefix` and `tags`.
- Routers are mounted in `app/main.py` via `app.include_router(...)`.

### Route Handlers
- All route handlers are `async def`.
- Inject the DB session with `db: Session = Depends(get_db)`.
- Request bodies are typed Pydantic `BaseModel` subclasses.
- Response models are declared via `response_model=` on the route decorator.
- Use `HTTPException` for error responses — never return raw dicts for errors.

### Pydantic Models
- Define in `app/models/<resource>.py` alongside the SQLAlchemy model.
- Use Pydantic v2 syntax: `model_config = ConfigDict(from_attributes=True)` on read models.
- Separate request models (e.g. `LogCreate`) from response models (e.g. `LogRead`).

---

## Startup Command

```bash
cd backend
uv run uvicorn app.main:app --reload --port 8000
```

- API docs (Swagger UI): http://localhost:8000/docs
- OpenAPI schema: http://localhost:8000/openapi.json

---

## What NOT To Do

- Do NOT use `pip install` — use `uv add`.
- Do NOT write raw SQL that bypasses SQLAlchemy — use the ORM.
- Do NOT use the legacy `Column()` SQLAlchemy 1.x style — use `Mapped` + `mapped_column()`.
- Do NOT share the `pyproject.toml` or `uv.lock` with `mcp-server/`.
- Do NOT return untyped dicts from route handlers — always use Pydantic response models.
- Do NOT use the old Pydantic v1 `class Config` pattern — use `model_config = ConfigDict(...)`.
- Do NOT hand-edit `dev-digest.db` — always use Alembic migrations.
