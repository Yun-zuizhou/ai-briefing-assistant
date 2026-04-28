from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.engine.url import make_url
from sqlalchemy.orm import declarative_base, sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./var/local/info_collector.db")


def _ensure_sqlite_parent_directory(database_url: str) -> None:
    try:
        parsed = make_url(database_url)
    except Exception:
        return

    if not str(parsed.drivername).startswith("sqlite"):
        return

    raw_path = parsed.database
    if not raw_path or raw_path == ":memory:":
        return

    path = Path(raw_path).expanduser()
    if not path.is_absolute():
        path = (Path.cwd() / path).resolve()

    parent = path.parent
    if not parent.exists():
        parent.mkdir(parents=True, exist_ok=True)


_ensure_sqlite_parent_directory(DATABASE_URL)

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
