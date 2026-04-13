import json
import sqlite3
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
LOCAL_DB = ROOT / "info_collector.db"
MOCK_DIR = ROOT / "prototype" / "demo" / "mock-data"
OUTPUT_SQL = ROOT / "cloudflare" / "d1" / "seed.generated.sql"


def sql_value(value):
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "1" if value else "0"
    if isinstance(value, (int, float)):
        return str(value)
    text = str(value).replace("'", "''")
    return f"'{text}'"


def insert_sql(table, columns, rows):
    statements = []
    col_sql = ", ".join(columns)
    for row in rows:
        values = ", ".join(sql_value(row.get(col)) for col in columns)
        statements.append(f"INSERT OR REPLACE INTO {table} ({col_sql}) VALUES ({values});")
    return statements


def fetch_sqlite_rows(conn, table, columns):
    cur = conn.cursor()
    try:
        cur.execute(f"SELECT {', '.join(columns)} FROM {table}")
    except sqlite3.OperationalError:
        return []
    items = []
    for raw in cur.fetchall():
        items.append({columns[idx]: raw[idx] for idx in range(len(columns))})
    return items


def load_json_array(path):
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8") as fh:
        data = json.load(fh)
    return data if isinstance(data, list) else []


def main():
    OUTPUT_SQL.parent.mkdir(parents=True, exist_ok=True)
    statements = ["BEGIN TRANSACTION;"]

    conn = sqlite3.connect(LOCAL_DB)

    table_specs = {
        "users": [
            "id", "username", "email", "hashed_password", "nickname", "avatar",
            "is_active", "is_superuser", "interests", "total_read", "total_thoughts",
            "total_completed", "streak_days", "created_at", "updated_at", "last_login",
        ],
        "hot_topics": [
            "id", "title", "summary", "content", "source", "source_url", "author",
            "categories", "tags", "keywords", "hot_value", "view_count", "like_count",
            "comment_count", "quality_score", "relevance_score", "published_at",
            "fetched_at", "hot_comments", "guide_questions", "raw_data",
        ],
        "opportunities": [
            "id", "title", "type", "status", "source", "source_url", "source_id",
            "content", "summary", "requirements", "published_at", "deadline",
            "start_time", "reward", "reward_min", "reward_max", "reward_unit",
            "location", "is_remote", "tags", "category", "quality_score",
            "reliability_score", "view_count", "favorite_count", "fetched_at",
            "updated_at", "raw_data",
        ],
        "todos": [
            "id", "user_id", "content", "description", "status", "priority", "deadline",
            "reminder_time", "related_type", "related_id", "related_title", "tags",
            "completed_at", "created_at", "updated_at",
        ],
        "rss_sources": [
            "id", "name", "url", "description", "category", "tags", "enabled",
            "last_fetch_time", "last_etag", "last_modified", "total_articles",
            "fetch_count", "error_count", "last_error", "fetch_interval", "config",
            "created_at", "updated_at",
        ],
        "rss_articles": [
            "id", "title", "summary", "content", "source_id", "source_name", "source_url",
            "author", "category", "tags", "publish_time", "fetch_time", "guid",
            "quality_score", "view_count", "raw_data",
        ],
    }

    for table, columns in table_specs.items():
        rows = fetch_sqlite_rows(conn, table, columns)
        if table == "hot_topics" and not rows:
            rows = load_json_array(MOCK_DIR / "hot-topics" / "hot-topics.json")
        if table == "opportunities" and not rows:
            rows = load_json_array(MOCK_DIR / "opportunities" / "opportunities.json")
        statements.extend(insert_sql(table, columns, rows))

    favorites = load_json_array(MOCK_DIR / "user-data" / "favorites.json")
    if favorites:
        statements.extend(insert_sql(
            "favorites",
            ["id", "user_id", "item_type", "item_id", "item_title", "item_summary", "item_source", "item_url", "created_at"],
            favorites,
        ))

    thoughts = load_json_array(MOCK_DIR / "user-data" / "thoughts.json")
    if thoughts:
        normalized_notes = []
        for item in thoughts:
            normalized_notes.append({
                "id": item.get("id"),
                "user_id": item.get("user_id", 1),
                "content": item.get("content"),
                "source_type": item.get("source_type", "manual"),
                "source_id": item.get("source_id"),
                "tags": json.dumps(item.get("tags", []), ensure_ascii=False) if isinstance(item.get("tags"), list) else item.get("tags", "[]"),
                "created_at": item.get("created_at"),
                "updated_at": item.get("updated_at"),
            })
        statements.extend(insert_sql(
            "notes",
            ["id", "user_id", "content", "source_type", "source_id", "tags", "created_at", "updated_at"],
            normalized_notes,
        ))

    profile_path = MOCK_DIR / "user-data" / "user-profile.json"
    if profile_path.exists():
        with profile_path.open("r", encoding="utf-8") as fh:
            profile = json.load(fh)
        if isinstance(profile, dict):
            statements.extend(insert_sql(
                "user_profiles",
                ["id", "user_id", "summary", "profile_data", "version", "generated_at", "created_at", "updated_at"],
                [{
                    "id": profile.get("id", 1),
                    "user_id": profile.get("user_id", 1),
                    "summary": profile.get("summary") or profile.get("persona_summary") or profile.get("title"),
                    "profile_data": json.dumps(profile, ensure_ascii=False),
                    "version": profile.get("version", "v1"),
                    "generated_at": profile.get("generated_at") or profile.get("updated_at") or profile.get("created_at"),
                    "created_at": profile.get("created_at"),
                    "updated_at": profile.get("updated_at"),
                }],
            ))

    settings_path = MOCK_DIR / "user-data" / "user-settings.json"
    if settings_path.exists():
        with settings_path.open("r", encoding="utf-8") as fh:
            settings = json.load(fh)
        if isinstance(settings, dict):
            statements.extend(insert_sql(
                "user_settings",
                ["id", "user_id", "morning_briefing_time", "evening_briefing_time", "do_not_disturb_start", "do_not_disturb_end", "push_enabled", "created_at", "updated_at"],
                [{
                    "id": settings.get("id", 1),
                    "user_id": settings.get("user_id", 1),
                    "morning_briefing_time": settings.get("morning_briefing_time", "08:00"),
                    "evening_briefing_time": settings.get("evening_briefing_time", "21:00"),
                    "do_not_disturb_start": settings.get("do_not_disturb_start"),
                    "do_not_disturb_end": settings.get("do_not_disturb_end"),
                    "push_enabled": 1,
                    "created_at": settings.get("created_at"),
                    "updated_at": settings.get("updated_at"),
                }],
            ))

    for file_name in ["morning-briefing.json", "evening-briefing.json"]:
        path = MOCK_DIR / "briefings" / file_name
        if not path.exists():
            continue
        with path.open("r", encoding="utf-8") as fh:
            briefing = json.load(fh)
        if isinstance(briefing, dict):
            statements.extend(insert_sql(
                "briefings",
                ["id", "user_id", "briefing_date", "briefing_type", "issue_number", "title", "summary_text", "payload", "created_at", "updated_at"],
                [{
                    "id": briefing.get("id"),
                    "user_id": briefing.get("user_id", 1),
                    "briefing_date": briefing.get("briefing_date"),
                    "briefing_type": briefing.get("briefing_type"),
                    "issue_number": briefing.get("issue_number"),
                    "title": briefing.get("title"),
                    "summary_text": briefing.get("summary") or briefing.get("global_summary", {}).get("summary"),
                    "payload": json.dumps(briefing, ensure_ascii=False),
                    "created_at": briefing.get("created_at"),
                    "updated_at": briefing.get("updated_at"),
                }],
            ))

    statements.append("COMMIT;")
    OUTPUT_SQL.write_text("\n".join(statements) + "\n", encoding="utf-8")
    print(f"已生成 {OUTPUT_SQL}")


if __name__ == "__main__":
    main()
