from __future__ import annotations

import argparse
import sqlite3
import sys
from pathlib import Path
from typing import Protocol


ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.services.d1_client import D1Client, D1ClientError


ANCHOR_TABLES: dict[str, tuple[str, ...]] = {
    "users": (
        "id",
        "username",
        "email",
        "hashed_password",
        "is_active",
    ),
    "user_settings": (
        "id",
        "user_id",
        "morning_brief_time",
        "evening_brief_time",
        "do_not_disturb_enabled",
        "sound_enabled",
        "vibration_enabled",
    ),
    "user_interests": (
        "id",
        "user_id",
        "interest_name",
        "status",
    ),
    "rss_sources": (
        "id",
        "name",
        "url",
        "category",
        "enabled",
    ),
    "rss_articles": (
        "id",
        "title",
        "source_id",
        "source_name",
        "source_url",
        "publish_time",
    ),
    "hot_topics": (
        "id",
        "title",
        "source",
        "source_url",
        "categories",
        "tags",
        "hot_value",
    ),
    "opportunities": (
        "id",
        "title",
        "type",
        "status",
        "source",
        "source_url",
        "deadline",
    ),
    "todos": (
        "id",
        "user_id",
        "content",
        "status",
        "priority",
        "deadline",
        "related_type",
        "related_id",
        "related_title",
        "tags",
    ),
    "favorites": (
        "id",
        "user_id",
        "item_type",
        "item_id",
        "item_title",
    ),
    "notes": (
        "id",
        "user_id",
        "content",
        "source_type",
        "tags",
    ),
    "history_entries": (
        "id",
        "user_id",
        "event_type",
        "title",
        "ref_type",
        "ref_id",
    ),
    "opportunity_follows": (
        "id",
        "user_id",
        "opportunity_id",
        "status",
        "note",
        "next_step",
    ),
    "chat_sessions": (
        "id",
        "user_id",
        "status",
        "source_context",
        "last_message_at",
    ),
    "chat_messages": (
        "id",
        "session_id",
        "role",
        "content",
        "message_state",
        "candidate_intents_json",
        "change_log_json",
    ),
    "briefings": (
        "id",
        "user_id",
        "briefing_date",
        "briefing_type",
        "status",
        "payload",
        "generated_at",
    ),
    "reports": (
        "id",
        "user_id",
        "report_type",
        "period_start",
        "period_end",
        "status",
        "report_payload_json",
        "generated_at",
    ),
    "user_profiles": (
        "id",
        "user_id",
        "summary",
        "version",
        "profile_data",
        "generated_at",
    ),
    "article_processing_results": (
        "id",
        "source_article_id",
        "source_content_ref",
        "normalized_title",
        "normalized_category_labels_json",
    ),
    "hot_topic_processing_results": (
        "id",
        "source_hot_topic_id",
        "source_content_ref",
        "normalized_title",
        "normalized_category_labels_json",
    ),
    "user_sessions": (
        "id",
        "user_id",
        "token_hash",
        "expires_at",
    ),
    "feedback_submissions": (
        "id",
        "user_id",
        "feedback_type",
        "content",
        "status",
    ),
}

ANCHOR_INDEXES: dict[str, tuple[str, ...]] = {
    "chat_sessions": (
        "idx_chat_sessions_user_id",
        "idx_chat_sessions_status",
        "idx_chat_sessions_last_message_at",
        "idx_chat_sessions_single_active",
    ),
    "favorites": (
        "idx_favorites_user_id",
        "idx_favorites_unique_item",
    ),
    "history_entries": (
        "idx_history_entries_user_id",
        "idx_history_entries_user_created",
        "idx_history_entries_user_event_created",
    ),
    "opportunity_follows": (
        "sqlite_autoindex_opportunity_follows_1",
        "idx_opportunity_follows_user_status",
        "idx_opportunity_follows_user_updated",
    ),
    "briefings": (
        "idx_briefings_user_date",
        "idx_briefings_user_type",
        "idx_briefings_generated_at",
    ),
    "reports": (
        "idx_reports_user_type",
        "idx_reports_period",
        "idx_reports_generated_at",
        "idx_reports_unique_period",
    ),
}


class SchemaReader(Protocol):
    def table_exists(self, table: str) -> bool: ...

    def get_columns(self, table: str) -> set[str]: ...

    def get_indexes(self, table: str) -> set[str]: ...


class SQLiteSchemaReader:
    def __init__(self, db_path: Path) -> None:
        self.connection = sqlite3.connect(db_path)
        self.connection.row_factory = sqlite3.Row

    def table_exists(self, table: str) -> bool:
        cursor = self.connection.execute(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
            [table],
        )
        return cursor.fetchone() is not None

    def get_columns(self, table: str) -> set[str]:
        cursor = self.connection.execute(f"PRAGMA table_info({table})")
        return {str(row["name"]) for row in cursor.fetchall()}

    def get_indexes(self, table: str) -> set[str]:
        cursor = self.connection.execute(f"PRAGMA index_list({table})")
        return {str(row["name"]) for row in cursor.fetchall()}

    def close(self) -> None:
        self.connection.close()


class D1SchemaReader:
    def __init__(self) -> None:
        self.client = D1Client()

    def table_exists(self, table: str) -> bool:
        rows = self.client.query(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
            [table],
        )
        return bool(rows)

    def get_columns(self, table: str) -> set[str]:
        rows = self.client.query(f"PRAGMA table_info({table})")
        return {str(row.get("name") or "") for row in rows if row.get("name")}

    def get_indexes(self, table: str) -> set[str]:
        rows = self.client.query(f"PRAGMA index_list({table})")
        return {str(row.get("name") or "") for row in rows if row.get("name")}


def audit_schema(reader: SchemaReader, tables: list[str]) -> int:
    issues = 0
    for table in tables:
        expected_columns = ANCHOR_TABLES[table]
        if not reader.table_exists(table):
            print(f"[MISSING TABLE] {table}")
            issues += 1
            continue

        columns = reader.get_columns(table)
        missing_columns = [column for column in expected_columns if column not in columns]
        if missing_columns:
            print(f"[DRIFT] {table} missing columns: {', '.join(missing_columns)}")
            issues += 1
            continue

        expected_indexes = ANCHOR_INDEXES.get(table, ())
        if expected_indexes:
            indexes = reader.get_indexes(table)
            missing_indexes = [index for index in expected_indexes if index not in indexes]
            if missing_indexes:
                print(f"[DRIFT] {table} missing indexes: {', '.join(missing_indexes)}")
                issues += 1
                continue

        print(f"[OK] {table}")
    return issues


def main() -> None:
    parser = argparse.ArgumentParser(description="Audit stable D1 anchor tables.")
    parser.add_argument("--sqlite-path", default="", help="Audit a local sqlite file instead of remote D1.")
    parser.add_argument("--tables", default="", help="Comma-separated table names to audit.")
    args = parser.parse_args()

    if args.tables:
        tables = [item.strip() for item in args.tables.split(",") if item.strip()]
    else:
        tables = list(ANCHOR_TABLES.keys())

    unknown = [table for table in tables if table not in ANCHOR_TABLES]
    if unknown:
        raise SystemExit(f"Unknown anchor tables: {', '.join(unknown)}")

    if args.sqlite_path:
        reader = SQLiteSchemaReader(Path(args.sqlite_path))
        try:
            issues = audit_schema(reader, tables)
        finally:
            reader.close()
    else:
        try:
            reader = D1SchemaReader()
        except D1ClientError as error:
            raise SystemExit(str(error))
        issues = audit_schema(reader, tables)

    if issues:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
