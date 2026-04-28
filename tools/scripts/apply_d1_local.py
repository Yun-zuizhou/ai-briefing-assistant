from __future__ import annotations

import argparse
import sqlite3
import sys
import time
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
MIGRATIONS_DIR = ROOT / "infra" / "cloudflare" / "d1" / "migrations"
LOCAL_D1_ROOT = ROOT / "apps" / "edge-worker" / ".wrangler" / "state" / "v3" / "d1"

SCHEMA_MIGRATIONS_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS schema_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL UNIQUE,
    applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
"""


def split_sql_statements(text: str) -> list[str]:
    statements: list[str] = []
    current: list[str] = []
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("--"):
            continue
        current.append(line)
        if stripped.endswith(";"):
            statement = "\n".join(current).strip()
            if statement:
                statements.append(statement)
            current = []
    if current:
        statement = "\n".join(current).strip()
        if statement:
            statements.append(statement)
    return statements


def should_ignore_sqlite_error(error: sqlite3.Error) -> bool:
    message = str(error).lower()
    return any(
        fragment in message
        for fragment in [
            "duplicate column name",
            "already exists",
            "duplicate index name",
            "no such column",
        ]
    )


def find_local_d1_files() -> list[Path]:
    if not LOCAL_D1_ROOT.exists():
        return []
    return sorted(LOCAL_D1_ROOT.rglob("*.sqlite"))


def wait_for_local_d1_files(wait_seconds: int) -> list[Path]:
    deadline = time.time() + max(wait_seconds, 0)
    while time.time() <= deadline:
        files = find_local_d1_files()
        if files:
            return files
        time.sleep(0.5)
    return find_local_d1_files()

def ensure_schema_migrations_table(connection: sqlite3.Connection) -> None:
    connection.executescript(SCHEMA_MIGRATIONS_TABLE_SQL)
    connection.commit()


def list_applied_migrations(connection: sqlite3.Connection) -> set[str]:
    rows = connection.execute("SELECT filename FROM schema_migrations ORDER BY id ASC").fetchall()
    return {str(row[0]) for row in rows if row and row[0]}


def record_applied_migration(connection: sqlite3.Connection, filename: str) -> None:
    connection.execute(
        "INSERT OR IGNORE INTO schema_migrations (filename) VALUES (?)",
        [filename],
    )
    connection.commit()


def apply_migrations_to_file(
    db_path: Path,
    migration_files: list[Path],
    *,
    mark_all_applied: bool = False,
) -> tuple[int, int, int]:
    applied = 0
    skipped = 0
    marked = 0
    connection = sqlite3.connect(db_path)
    try:
        ensure_schema_migrations_table(connection)
        cursor = connection.cursor()
        applied_migrations = list_applied_migrations(connection)

        for migration_file in migration_files:
            if migration_file.name in applied_migrations:
                continue
            if mark_all_applied:
                record_applied_migration(connection, migration_file.name)
                marked += 1
                continue

            statements = split_sql_statements(migration_file.read_text(encoding="utf-8"))
            for statement in statements:
                try:
                    cursor.executescript(statement)
                    applied += 1
                except sqlite3.Error as error:
                    if should_ignore_sqlite_error(error):
                        skipped += 1
                        continue
                    raise
            connection.commit()
            record_applied_migration(connection, migration_file.name)
        return applied, skipped, marked
    finally:
        connection.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Apply Cloudflare D1 migrations to the local Miniflare sqlite database.")
    parser.add_argument("--wait-seconds", type=int, default=0, help="Wait for local D1 sqlite files to appear before applying migrations.")
    parser.add_argument("--mark-all-applied", action="store_true", help="Mark local migrations as applied without executing SQL.")
    args = parser.parse_args()

    migration_files = sorted(MIGRATIONS_DIR.glob("*.sql"))
    if not migration_files:
        raise RuntimeError("No D1 migration files were found.")

    local_d1_files = wait_for_local_d1_files(args.wait_seconds)
    if not local_d1_files:
        print("No local D1 sqlite files found, skipped local migration apply.")
        return

    total_applied = 0
    total_skipped = 0
    total_marked = 0
    for db_path in local_d1_files:
        applied, skipped, marked = apply_migrations_to_file(
            db_path,
            migration_files,
            mark_all_applied=args.mark_all_applied,
        )
        total_applied += applied
        total_skipped += skipped
        total_marked += marked
        print(f"Applied local D1 migrations to {db_path.name}: {applied} statements, skipped {skipped}, marked {marked}")

    print(f"Local D1 migration apply completed: applied={total_applied}, skipped={total_skipped}, marked={total_marked}")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:  # pragma: no cover - script entrypoint
        print(str(error), file=sys.stderr)
        sys.exit(1)
