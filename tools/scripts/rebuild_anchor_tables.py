from __future__ import annotations

import argparse
import sqlite3
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


REPORTS_REBUILD_SQL = """
BEGIN TRANSACTION;

DROP TABLE IF EXISTS reports__anchor;

CREATE TABLE reports__anchor (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    report_type TEXT NOT NULL,
    period_start TEXT,
    period_end TEXT,
    title TEXT NOT NULL,
    summary_text TEXT,
    status TEXT NOT NULL DEFAULT 'ready',
    report_payload_json TEXT,
    generated_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO reports__anchor (
    id,
    user_id,
    report_type,
    period_start,
    period_end,
    title,
    summary_text,
    status,
    report_payload_json,
    generated_at,
    created_at,
    updated_at
)
SELECT
    id,
    user_id,
    report_type,
    period_start,
    period_end,
    title,
    summary_text,
    COALESCE(status, 'ready') AS status,
    report_payload_json,
    generated_at,
    COALESCE(created_at, CURRENT_TIMESTAMP) AS created_at,
    updated_at
FROM (
    SELECT
        *,
        ROW_NUMBER() OVER (
            PARTITION BY user_id, report_type, COALESCE(period_start, ''), COALESCE(period_end, '')
            ORDER BY datetime(COALESCE(generated_at, updated_at, created_at, CURRENT_TIMESTAMP)) DESC, id DESC
        ) AS row_rank
    FROM reports
)
WHERE row_rank = 1;

DROP TABLE reports;
ALTER TABLE reports__anchor RENAME TO reports;

CREATE INDEX IF NOT EXISTS idx_reports_user_type
ON reports(user_id, report_type);

CREATE INDEX IF NOT EXISTS idx_reports_period
ON reports(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_reports_generated_at
ON reports(generated_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_unique_period
ON reports(user_id, report_type, COALESCE(period_start, ''), COALESCE(period_end, ''));

COMMIT;
"""


def rebuild_reports_sqlite(db_path: Path) -> None:
    connection = sqlite3.connect(db_path)
    try:
        connection.executescript(REPORTS_REBUILD_SQL)
        connection.commit()
    finally:
        connection.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Rebuild selected anchor tables.")
    parser.add_argument(
        "--table",
        choices=("reports",),
        default="reports",
        help="Anchor table to rebuild.",
    )
    parser.add_argument(
        "--sqlite-path",
        default="",
        help="Execute the rebuild against a local sqlite database file.",
    )
    parser.add_argument(
        "--emit-sql",
        default="",
        help="Write the rebuild SQL plan to a file.",
    )
    args = parser.parse_args()

    sql = REPORTS_REBUILD_SQL

    if args.emit_sql:
        output_path = Path(args.emit_sql)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(sql, encoding="utf-8")
        print(f"Wrote rebuild SQL to {output_path}")

    if args.sqlite_path:
        rebuild_reports_sqlite(Path(args.sqlite_path))
        print(f"Rebuilt {args.table} on sqlite database: {args.sqlite_path}")

    if not args.emit_sql and not args.sqlite_path:
        print(sql)


if __name__ == "__main__":
    main()
