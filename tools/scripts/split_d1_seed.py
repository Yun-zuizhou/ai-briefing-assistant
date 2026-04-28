from __future__ import annotations

import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SEED_ROOT = ROOT / "infra" / "cloudflare" / "d1" / "seeds" / "generated"
SEED_FILE = SEED_ROOT / "seed.remote.sql"
MASTER_SEED_FILE = SEED_ROOT / "seed.master.sql"
CONTENT_SEED_FILE = SEED_ROOT / "seed.content.sql"
CONTENT_RSS_SOURCES_SEED_FILE = SEED_ROOT / "seed.content.rss_sources.sql"
CONTENT_RSS_ARTICLES_SEED_FILE = SEED_ROOT / "seed.content.rss_articles.sql"
CONTENT_HOT_TOPICS_SEED_FILE = SEED_ROOT / "seed.content.hot_topics.sql"
CONTENT_OPPORTUNITIES_SEED_FILE = SEED_ROOT / "seed.content.opportunities.sql"
CONTENT_DERIVED_SEED_FILE = SEED_ROOT / "seed.content.derived.sql"
RSS_ARTICLE_PART_PREFIX = "seed.content.rss_articles.part"
RSS_ARTICLE_PART_SIZE = 200

MASTER_TABLES = {
    "users",
    "user_interests",
    "user_settings",
    "todos",
    "notes",
    "favorites",
    "history_entries",
}

CONTENT_TABLES = {
    "rss_sources",
    "rss_articles",
    "hot_topics",
    "opportunities",
    "briefings",
    "user_profiles",
}

CONTENT_FILE_MAP = {
    "rss_sources": CONTENT_RSS_SOURCES_SEED_FILE,
    "rss_articles": CONTENT_RSS_ARTICLES_SEED_FILE,
    "hot_topics": CONTENT_HOT_TOPICS_SEED_FILE,
    "opportunities": CONTENT_OPPORTUNITIES_SEED_FILE,
    "briefings": CONTENT_DERIVED_SEED_FILE,
    "user_profiles": CONTENT_DERIVED_SEED_FILE,
}

INSERT_PATTERN = re.compile(r"^INSERT OR REPLACE INTO ([A-Za-z_]+)\b")


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


def detect_table(statement: str) -> str | None:
    first_line = statement.splitlines()[0].strip()
    match = INSERT_PATTERN.match(first_line)
    if not match:
        return None
    return match.group(1)


def write_sql(path: Path, statements: list[str]) -> None:
    text = ""
    if statements:
        text = "\n".join(statements) + "\n"
    path.write_text(text, encoding="utf-8")


def chunked(items: list[str], size: int) -> list[list[str]]:
    return [items[index:index + size] for index in range(0, len(items), size)]


def cleanup_old_rss_article_parts(directory: Path) -> None:
    for path in directory.glob(f"{RSS_ARTICLE_PART_PREFIX}*.sql"):
        path.unlink(missing_ok=True)


def main() -> None:
    if not SEED_FILE.exists():
        raise SystemExit("未找到 infra/cloudflare/d1/seeds/generated/seed.remote.sql，请先生成远端 seed。")

    statements = split_sql_statements(SEED_FILE.read_text(encoding="utf-8"))

    master_statements: list[str] = []
    content_statements: list[str] = []
    other_statements: list[str] = []
    content_buckets: dict[Path, list[str]] = {
        CONTENT_RSS_SOURCES_SEED_FILE: [],
        CONTENT_RSS_ARTICLES_SEED_FILE: [],
        CONTENT_HOT_TOPICS_SEED_FILE: [],
        CONTENT_OPPORTUNITIES_SEED_FILE: [],
        CONTENT_DERIVED_SEED_FILE: [],
    }

    for statement in statements:
        table = detect_table(statement)
        if table in MASTER_TABLES:
            master_statements.append(statement)
        elif table in CONTENT_TABLES:
            content_statements.append(statement)
            content_buckets[CONTENT_FILE_MAP[table]].append(statement)
        else:
            other_statements.append(statement)

    write_sql(MASTER_SEED_FILE, master_statements)
    write_sql(CONTENT_SEED_FILE, content_statements + other_statements)
    for path, bucket in content_buckets.items():
        write_sql(path, bucket)
    cleanup_old_rss_article_parts(CONTENT_RSS_ARTICLES_SEED_FILE.parent)
    rss_article_parts = chunked(content_buckets[CONTENT_RSS_ARTICLES_SEED_FILE], RSS_ARTICLE_PART_SIZE)
    for index, bucket in enumerate(rss_article_parts, start=1):
        part_path = CONTENT_RSS_ARTICLES_SEED_FILE.parent / f"{RSS_ARTICLE_PART_PREFIX}{index:02d}.sql"
        write_sql(part_path, bucket)

    print(f"Generated {MASTER_SEED_FILE.name}: {len(master_statements)} statements")
    print(f"Generated {CONTENT_SEED_FILE.name}: {len(content_statements) + len(other_statements)} statements")
    for path, bucket in content_buckets.items():
        print(f"Generated {path.name}: {len(bucket)} statements")
    for index, bucket in enumerate(rss_article_parts, start=1):
        print(f"Generated {RSS_ARTICLE_PART_PREFIX}{index:02d}.sql: {len(bucket)} statements")
    if other_statements:
        print(f"Unclassified statements merged into {CONTENT_SEED_FILE.name}: {len(other_statements)}")


if __name__ == "__main__":
    main()
