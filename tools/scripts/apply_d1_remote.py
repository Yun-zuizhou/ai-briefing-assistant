from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MIGRATIONS_DIR = ROOT / "infra" / "cloudflare" / "d1" / "migrations"
SEED_ROOT = ROOT / "infra" / "cloudflare" / "d1" / "seeds" / "generated"
SEED_FILE = SEED_ROOT / "seed.remote.sql"
MASTER_SEED_FILE = SEED_ROOT / "seed.master.sql"
CONTENT_SEED_FILE = SEED_ROOT / "seed.content.sql"
CONTENT_RSS_SOURCES_SEED_FILE = SEED_ROOT / "seed.content.rss_sources.sql"
CONTENT_RSS_ARTICLES_SEED_FILE = SEED_ROOT / "seed.content.rss_articles.sql"
CONTENT_HOT_TOPICS_SEED_FILE = SEED_ROOT / "seed.content.hot_topics.sql"
CONTENT_OPPORTUNITIES_SEED_FILE = SEED_ROOT / "seed.content.opportunities.sql"
CONTENT_DERIVED_SEED_FILE = SEED_ROOT / "seed.content.derived.sql"
RSS_ARTICLE_PART_GLOB = "seed.content.rss_articles.part*.sql"
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.services.d1_client import D1Client, D1ClientError


SCHEMA_MIGRATIONS_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS schema_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL UNIQUE,
    applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
"""


def should_ignore_statement_error(error: D1ClientError) -> bool:
    message = str(error).lower()
    tolerated_fragments = [
        "duplicate column name",
        "already exists",
        "duplicate index name",
    ]
    return any(fragment in message for fragment in tolerated_fragments)


def split_sql_statements(text: str) -> list[str]:
    statements: list[str] = []
    current: list[str] = []
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        if stripped.startswith("--"):
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


def apply_sql_file(client: D1Client, path: Path) -> int:
    sql = path.read_text(encoding="utf-8")
    statements = split_sql_statements(sql)
    applied_count = 0
    for statement in statements:
        try:
            client.execute(statement)
            applied_count += 1
        except D1ClientError as error:
            if should_ignore_statement_error(error):
                print(f"Skipped already-applied statement in {path.name}: {error}")
                continue
            raise
    return applied_count


def apply_sql_files(client: D1Client, paths: list[Path]) -> int:
    total = 0
    for path in paths:
        if not path.exists():
            raise D1ClientError(f"未找到 {path.name}，请先执行 node tools/scripts/prepare-d1.mjs")
        count = apply_sql_file(client, path)
        total += count
        print(f"Applied {path.name}: {count} statements")
    return total


def ensure_schema_migrations_table(client: D1Client) -> None:
    client.execute(SCHEMA_MIGRATIONS_TABLE_SQL)


def list_applied_migrations(client: D1Client) -> set[str]:
    rows = client.query("SELECT filename FROM schema_migrations ORDER BY id ASC")
    return {str(row.get("filename") or "") for row in rows if row.get("filename")}


def record_applied_migration(client: D1Client, filename: str) -> None:
    client.execute(
        "INSERT OR IGNORE INTO schema_migrations (filename) VALUES (?)",
        [filename],
    )


def mark_all_migrations_as_applied(client: D1Client, migration_files: list[Path]) -> int:
    applied = list_applied_migrations(client)
    marked = 0
    for path in migration_files:
        if path.name in applied:
            continue
        record_applied_migration(client, path.name)
        marked += 1
        print(f"Marked {path.name} as applied")
    return marked


def main() -> None:
    parser = argparse.ArgumentParser(description="Apply D1 migrations and optional seed data.")
    parser.add_argument("--with-seed", action="store_true", help="Apply infra/cloudflare/d1/seeds/generated/seed.remote.sql after migrations.")
    parser.add_argument("--seed-only", action="store_true", help="Apply seed only without re-running migrations.")
    parser.add_argument("--seed-file", default="", help="Apply a specific seed file path when --with-seed is enabled.")
    parser.add_argument(
        "--seed-scope",
        choices=("master", "content", "content-rss-sources", "content-rss-articles", "content-hot-topics", "content-opportunities", "content-derived", "all"),
        default="all",
        help="Choose which split seed file to apply when --with-seed is enabled.",
    )
    parser.add_argument(
        "--mark-all-applied",
        action="store_true",
        help="Mark all current migration files as applied without executing them.",
    )
    args = parser.parse_args()

    client = D1Client()
    ensure_schema_migrations_table(client)

    total = 0
    migration_files = sorted(MIGRATIONS_DIR.glob("*.sql"))
    if not migration_files:
        raise D1ClientError("未找到 D1 migration 文件")

    if args.mark_all_applied:
        marked = mark_all_migrations_as_applied(client, migration_files)
        print(f"Marked migrations without execution: {marked}")
    elif not args.seed_only:
        applied_migrations = list_applied_migrations(client)
        for path in migration_files:
            if path.name in applied_migrations:
                print(f"Skipped already-tracked migration {path.name}")
                continue
            count = apply_sql_file(client, path)
            record_applied_migration(client, path.name)
            total += count
            print(f"Applied {path.name}: {count} statements")

    if args.with_seed:
        if args.seed_file:
            seed_paths = [Path(args.seed_file)]
        elif args.seed_scope == "master":
            seed_paths = [MASTER_SEED_FILE]
        elif args.seed_scope == "content-rss-sources":
            seed_paths = [CONTENT_RSS_SOURCES_SEED_FILE]
        elif args.seed_scope == "content-rss-articles":
            seed_paths = sorted(CONTENT_RSS_ARTICLES_SEED_FILE.parent.glob(RSS_ARTICLE_PART_GLOB))
            if not seed_paths:
                seed_paths = [CONTENT_RSS_ARTICLES_SEED_FILE]
        elif args.seed_scope == "content-hot-topics":
            seed_paths = [CONTENT_HOT_TOPICS_SEED_FILE]
        elif args.seed_scope == "content-opportunities":
            seed_paths = [CONTENT_OPPORTUNITIES_SEED_FILE]
        elif args.seed_scope == "content-derived":
            seed_paths = [CONTENT_DERIVED_SEED_FILE]
        elif args.seed_scope == "content":
            seed_paths = [CONTENT_SEED_FILE]
        else:
            seed_paths = [SEED_FILE]

        total += apply_sql_files(client, seed_paths)

    print(f"D1 remote apply completed, total statements: {total}")


if __name__ == "__main__":
    main()
