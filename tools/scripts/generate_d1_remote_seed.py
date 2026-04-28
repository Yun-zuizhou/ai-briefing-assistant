import json
import sqlite3
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
LOCAL_DB = ROOT / "var" / "local" / "info_collector.db"
MOCK_DIR = ROOT / "apps" / "web" / "demo" / "mock-data"
OUTPUT_SQL = ROOT / "infra" / "cloudflare" / "d1" / "seeds" / "generated" / "seed.remote.sql"


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


def fetch_rows(conn, table, columns):
    cur = conn.cursor()
    try:
        cur.execute(f"SELECT {', '.join(columns)} FROM {table}")
    except sqlite3.OperationalError:
        return []
    return [{columns[i]: row[i] for i in range(len(columns))} for row in cur.fetchall()]


def load_json_array(path):
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8") as fh:
        data = json.load(fh)
    return data if isinstance(data, list) else []


def compact_json(value, default):
    if value is None:
        value = default
    if isinstance(value, str):
        return value
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def truncate(text, limit):
    if text is None:
        return None
    text = str(text)
    return text if len(text) <= limit else text[:limit]


def main():
    OUTPUT_SQL.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(LOCAL_DB)
    statements = []

    users = fetch_rows(conn, "users", [
        "id", "username", "email", "hashed_password", "nickname", "avatar",
        "is_active", "is_superuser", "interests", "total_read", "total_thoughts",
        "total_completed", "streak_days", "created_at", "updated_at", "last_login",
    ])
    statements.extend(insert_sql("users", list(users[0].keys()) if users else [
        "id", "username", "email", "hashed_password", "nickname", "avatar",
        "is_active", "is_superuser", "interests", "total_read", "total_thoughts",
        "total_completed", "streak_days", "created_at", "updated_at", "last_login",
    ], users))

    user_interests = fetch_rows(conn, "user_interests", [
        "id", "user_id", "interest_name", "status", "created_at", "updated_at",
    ])
    statements.extend(insert_sql("user_interests", [
        "id", "user_id", "interest_name", "status", "created_at", "updated_at",
    ], user_interests))

    rss_sources = fetch_rows(conn, "rss_sources", [
        "id", "name", "url", "description", "category", "tags", "enabled",
        "last_fetch_time", "last_etag", "last_modified", "total_articles",
        "fetch_count", "error_count", "last_error", "fetch_interval", "config",
        "created_at", "updated_at",
    ])
    for item in rss_sources:
        item["tags"] = compact_json(item.get("tags"), [])
        item["config"] = compact_json(item.get("config"), {})
        item["description"] = truncate(item.get("description"), 1000)
        item["last_error"] = truncate(item.get("last_error"), 1000)
    statements.extend(insert_sql("rss_sources", [
        "id", "name", "url", "description", "category", "tags", "enabled",
        "last_fetch_time", "last_etag", "last_modified", "total_articles",
        "fetch_count", "error_count", "last_error", "fetch_interval", "config",
        "created_at", "updated_at",
    ], rss_sources))

    hot_topics = fetch_rows(conn, "hot_topics", [
        "id", "title", "summary", "content", "source", "source_url", "author",
        "categories", "tags", "keywords", "hot_value", "view_count", "like_count",
        "comment_count", "quality_score", "relevance_score", "published_at",
        "fetched_at", "hot_comments", "guide_questions",
    ])
    if not hot_topics:
        raw = load_json_array(MOCK_DIR / "hot-topics" / "hot-topics.json")
        for item in raw[:800]:
            hot_topics.append({
                "id": item.get("id"),
                "title": item.get("title"),
                "summary": truncate(item.get("summary"), 2000),
                "content": None,
                "source": item.get("source"),
                "source_url": item.get("source_url"),
                "author": item.get("author"),
                "categories": compact_json(item.get("categories"), []),
                "tags": compact_json(item.get("tags"), []),
                "keywords": compact_json(item.get("keywords"), []),
                "hot_value": item.get("hot_value", 0),
                "view_count": item.get("view_count", 0),
                "like_count": item.get("like_count", 0),
                "comment_count": item.get("comment_count", 0),
                "quality_score": item.get("quality_score", 0),
                "relevance_score": item.get("relevance_score", 0),
                "published_at": item.get("published_at"),
                "fetched_at": item.get("fetched_at"),
                "hot_comments": compact_json(item.get("hot_comments"), []),
                "guide_questions": compact_json(item.get("guide_questions"), []),
            })
    else:
        for item in hot_topics:
            item["summary"] = truncate(item.get("summary"), 2000)
            item["content"] = truncate(item.get("content"), 4000)
            item["categories"] = compact_json(item.get("categories"), [])
            item["tags"] = compact_json(item.get("tags"), [])
            item["keywords"] = compact_json(item.get("keywords"), [])
            item["hot_comments"] = compact_json(item.get("hot_comments"), [])
            item["guide_questions"] = compact_json(item.get("guide_questions"), [])
    statements.extend(insert_sql("hot_topics", [
        "id", "title", "summary", "content", "source", "source_url", "author",
        "categories", "tags", "keywords", "hot_value", "view_count", "like_count",
        "comment_count", "quality_score", "relevance_score", "published_at",
        "fetched_at", "hot_comments", "guide_questions",
    ], hot_topics))

    opportunities = fetch_rows(conn, "opportunities", [
        "id", "title", "type", "status", "source", "source_url", "source_id",
        "content", "summary", "requirements", "published_at", "deadline",
        "start_time", "reward", "reward_min", "reward_max", "reward_unit",
        "location", "is_remote", "tags", "category", "quality_score",
        "reliability_score", "view_count", "favorite_count", "fetched_at", "updated_at",
    ])
    if not opportunities:
        raw = load_json_array(MOCK_DIR / "opportunities" / "opportunities.json")
        for item in raw:
            opportunities.append({
                "id": item.get("id"),
                "title": item.get("title"),
                "type": item.get("type"),
                "status": item.get("status", "active"),
                "source": item.get("source"),
                "source_url": item.get("source_url"),
                "source_id": item.get("source_id"),
                "content": truncate(item.get("content"), 4000),
                "summary": truncate(item.get("summary"), 2000),
                "requirements": compact_json(item.get("requirements"), []),
                "published_at": item.get("published_at"),
                "deadline": item.get("deadline"),
                "start_time": item.get("start_time"),
                "reward": item.get("reward"),
                "reward_min": item.get("reward_min"),
                "reward_max": item.get("reward_max"),
                "reward_unit": item.get("reward_unit"),
                "location": item.get("location"),
                "is_remote": item.get("is_remote", 0),
                "tags": compact_json(item.get("tags"), []),
                "category": item.get("category"),
                "quality_score": item.get("quality_score", 0),
                "reliability_score": item.get("reliability_score", 0),
                "view_count": item.get("view_count", 0),
                "favorite_count": item.get("favorite_count", 0),
                "fetched_at": item.get("fetched_at"),
                "updated_at": item.get("updated_at"),
            })
    else:
        for item in opportunities:
            item["content"] = truncate(item.get("content"), 4000)
            item["summary"] = truncate(item.get("summary"), 2000)
            item["requirements"] = compact_json(item.get("requirements"), [])
            item["tags"] = compact_json(item.get("tags"), [])
    statements.extend(insert_sql("opportunities", [
        "id", "title", "type", "status", "source", "source_url", "source_id",
        "content", "summary", "requirements", "published_at", "deadline",
        "start_time", "reward", "reward_min", "reward_max", "reward_unit",
        "location", "is_remote", "tags", "category", "quality_score",
        "reliability_score", "view_count", "favorite_count", "fetched_at", "updated_at",
    ], opportunities))

    todos = fetch_rows(conn, "todos", [
        "id", "user_id", "content", "description", "status", "priority", "deadline",
        "reminder_time", "related_type", "related_id", "related_title", "tags",
        "completed_at", "created_at", "updated_at",
    ])
    for item in todos:
        item["tags"] = compact_json(item.get("tags"), [])
    statements.extend(insert_sql("todos", [
        "id", "user_id", "content", "description", "status", "priority", "deadline",
        "reminder_time", "related_type", "related_id", "related_title", "tags",
        "completed_at", "created_at", "updated_at",
    ], todos))

    rss_articles = fetch_rows(conn, "rss_articles", [
        "id", "title", "summary", "content", "source_id", "source_name", "source_url",
        "author", "category", "tags", "publish_time", "fetch_time", "guid",
        "quality_score", "view_count",
    ])
    for item in rss_articles:
        item["summary"] = truncate(item.get("summary"), 2000)
        item["content"] = truncate(item.get("content"), 4000)
        item["tags"] = compact_json(item.get("tags"), [])
    statements.extend(insert_sql("rss_articles", [
        "id", "title", "summary", "content", "source_id", "source_name", "source_url",
        "author", "category", "tags", "publish_time", "fetch_time", "guid",
        "quality_score", "view_count",
    ], rss_articles))

    favorites = load_json_array(MOCK_DIR / "user-data" / "favorites.json")
    if favorites:
        statements.extend(insert_sql(
            "favorites",
            ["id", "user_id", "item_type", "item_id", "item_title", "item_summary", "item_source", "item_url", "created_at"],
            favorites,
        ))

    thoughts = load_json_array(MOCK_DIR / "user-data" / "thoughts.json")
    if thoughts:
        notes = []
        for item in thoughts:
            notes.append({
                "id": item.get("id"),
                "user_id": item.get("user_id", 1),
                "content": truncate(item.get("content"), 4000),
                "source_type": item.get("source_type", "manual"),
                "source_id": item.get("source_id"),
                "tags": compact_json(item.get("tags"), []),
                "created_at": item.get("created_at"),
                "updated_at": item.get("updated_at"),
            })
        statements.extend(insert_sql(
            "notes",
            ["id", "user_id", "content", "source_type", "source_id", "tags", "created_at", "updated_at"],
            notes,
        ))

    profile_path = MOCK_DIR / "user-data" / "user-profile.json"
    if profile_path.exists():
        profile = json.loads(profile_path.read_text(encoding="utf-8"))
        if isinstance(profile, dict):
            statements.extend(insert_sql(
                "user_profiles",
                ["id", "user_id", "summary", "profile_data", "version", "generated_at", "created_at", "updated_at"],
                [{
                    "id": profile.get("id", 1),
                    "user_id": profile.get("user_id", 1),
                    "summary": truncate(profile.get("summary") or profile.get("persona_summary") or profile.get("title"), 2000),
                    "profile_data": truncate(json.dumps(profile, ensure_ascii=False, separators=(",", ":")), 8000),
                    "version": profile.get("version", "v1"),
                    "generated_at": profile.get("generated_at") or profile.get("updated_at") or profile.get("created_at"),
                    "created_at": profile.get("created_at"),
                    "updated_at": profile.get("updated_at"),
                }],
            ))

    settings_path = MOCK_DIR / "user-data" / "user-settings.json"
    if settings_path.exists():
        settings = json.loads(settings_path.read_text(encoding="utf-8"))
        if isinstance(settings, dict):
            statements.extend(insert_sql(
                "user_settings",
                [
                    "id", "user_id", "morning_brief_time", "evening_brief_time",
                    "do_not_disturb_enabled", "do_not_disturb_start", "do_not_disturb_end",
                    "sound_enabled", "vibration_enabled", "created_at", "updated_at",
                ],
                [{
                    "id": settings.get("id", 1),
                    "user_id": settings.get("user_id", 1),
                    "morning_brief_time": settings.get("morning_brief_time", settings.get("morning_briefing_time", "08:00")),
                    "evening_brief_time": settings.get("evening_brief_time", settings.get("evening_briefing_time", "21:00")),
                    "do_not_disturb_enabled": settings.get("do_not_disturb_enabled", 0),
                    "do_not_disturb_start": settings.get("do_not_disturb_start"),
                    "do_not_disturb_end": settings.get("do_not_disturb_end"),
                    "sound_enabled": settings.get("sound_enabled", 1),
                    "vibration_enabled": settings.get("vibration_enabled", 1),
                    "created_at": settings.get("created_at"),
                    "updated_at": settings.get("updated_at"),
                }],
            ))

    for file_name in ["morning-briefing.json", "evening-briefing.json"]:
        path = MOCK_DIR / "briefings" / file_name
        if not path.exists():
            continue
        briefing = json.loads(path.read_text(encoding="utf-8"))
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
                    "summary_text": truncate(briefing.get("summary") or briefing.get("global_summary", {}).get("summary"), 4000),
                    "payload": truncate(json.dumps(briefing, ensure_ascii=False, separators=(",", ":")), 12000),
                    "created_at": briefing.get("created_at"),
                    "updated_at": briefing.get("updated_at"),
                }],
            ))

    OUTPUT_SQL.write_text("\n".join(statements) + "\n", encoding="utf-8")
    print(f"已生成 {OUTPUT_SQL}")


if __name__ == "__main__":
    main()
