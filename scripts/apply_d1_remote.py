from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS_DIR = ROOT / "cloudflare" / "d1" / "migrations"
SEED_FILE = ROOT / "cloudflare" / "d1" / "seed.remote.sql"
MASTER_SEED_FILE = ROOT / "cloudflare" / "d1" / "seed.master.sql"
CONTENT_SEED_FILE = ROOT / "cloudflare" / "d1" / "seed.content.sql"
CONTENT_RSS_SOURCES_SEED_FILE = ROOT / "cloudflare" / "d1" / "seed.content.rss_sources.sql"
CONTENT_RSS_ARTICLES_SEED_FILE = ROOT / "cloudflare" / "d1" / "seed.content.rss_articles.sql"
CONTENT_HOT_TOPICS_SEED_FILE = ROOT / "cloudflare" / "d1" / "seed.content.hot_topics.sql"
CONTENT_OPPORTUNITIES_SEED_FILE = ROOT / "cloudflare" / "d1" / "seed.content.opportunities.sql"
CONTENT_DERIVED_SEED_FILE = ROOT / "cloudflare" / "d1" / "seed.content.derived.sql"
RSS_ARTICLE_PART_GLOB = "seed.content.rss_articles.part*.sql"
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.services.d1_client import D1Client, D1ClientError


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
    for statement in statements:
        client.execute(statement)
    return len(statements)


def apply_sql_files(client: D1Client, paths: list[Path]) -> int:
    total = 0
    for path in paths:
        if not path.exists():
            raise D1ClientError(f"未找到 {path.name}，请先执行 node scripts/prepare-d1.mjs")
        count = apply_sql_file(client, path)
        total += count
        print(f"Applied {path.name}: {count} statements")
    return total


def main() -> None:
    parser = argparse.ArgumentParser(description="Apply D1 migrations and optional seed data.")
    parser.add_argument("--with-seed", action="store_true", help="Apply cloudflare/d1/seed.remote.sql after migrations.")
    parser.add_argument("--seed-only", action="store_true", help="Apply seed only without re-running migrations.")
    parser.add_argument("--seed-file", default="", help="Apply a specific seed file path when --with-seed is enabled.")
    parser.add_argument(
        "--seed-scope",
        choices=("master", "content", "content-rss-sources", "content-rss-articles", "content-hot-topics", "content-opportunities", "content-derived", "all"),
        default="all",
        help="Choose which split seed file to apply when --with-seed is enabled.",
    )
    args = parser.parse_args()

    client = D1Client()

    total = 0
    if not args.seed_only:
        migration_files = sorted(MIGRATIONS_DIR.glob("*.sql"))
        if not migration_files:
            raise D1ClientError("未找到 D1 migration 文件")
        for path in migration_files:
            count = apply_sql_file(client, path)
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
