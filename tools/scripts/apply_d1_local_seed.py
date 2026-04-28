from __future__ import annotations

import argparse
import sqlite3
import sys
import time
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SEEDS_DIR = ROOT / "infra" / "cloudflare" / "d1" / "seeds" / "generated"
LOCAL_D1_ROOT = ROOT / "apps" / "edge-worker" / ".wrangler" / "state" / "v3" / "d1"

SEED_GROUPS: dict[str, list[str]] = {
    "content-minimal": [
        "seed.content.hot_topics.sql",
        "seed.content.opportunities.sql",
    ],
}


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
            "unique constraint failed",
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


def resolve_seed_paths(seed_group: str | None, seed_files: list[str]) -> list[Path]:
    selected: list[str] = []
    if seed_group:
      selected.extend(SEED_GROUPS.get(seed_group, []))
    selected.extend(seed_files)

    if not selected:
        raise RuntimeError("No local seed files selected.")

    paths: list[Path] = []
    for filename in selected:
        path = SEEDS_DIR / filename
        if not path.exists():
            raise RuntimeError(f"Seed file not found: {path}")
        paths.append(path)
    return paths


def apply_seed_files_to_db(db_path: Path, seed_paths: list[Path]) -> tuple[int, int]:
    applied = 0
    skipped = 0
    connection = sqlite3.connect(db_path)
    try:
        cursor = connection.cursor()
        for seed_path in seed_paths:
            statements = split_sql_statements(seed_path.read_text(encoding="utf-8"))
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
        return applied, skipped
    finally:
        connection.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Apply selected D1 seed files to local Miniflare sqlite databases.")
    parser.add_argument("--wait-seconds", type=int, default=0, help="Wait for local D1 sqlite files to appear before applying seeds.")
    parser.add_argument("--seed-group", choices=sorted(SEED_GROUPS.keys()), help="Apply a predefined local seed group.")
    parser.add_argument("--seed-file", action="append", default=[], help="Apply one or more explicit seed filenames from infra/cloudflare/d1/seeds/generated.")
    args = parser.parse_args()

    seed_paths = resolve_seed_paths(args.seed_group, args.seed_file)
    local_d1_files = wait_for_local_d1_files(args.wait_seconds)
    if not local_d1_files:
        print("No local D1 sqlite files found, skipped local seed apply.")
        return

    total_applied = 0
    total_skipped = 0
    for db_path in local_d1_files:
        applied, skipped = apply_seed_files_to_db(db_path, seed_paths)
        total_applied += applied
        total_skipped += skipped
        print(f"Applied local D1 seeds to {db_path.name}: {applied} statements, skipped {skipped}")

    print(f"Local D1 seed apply completed: applied={total_applied}, skipped={total_skipped}")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:  # pragma: no cover - script entrypoint
        print(str(error), file=sys.stderr)
        sys.exit(1)
