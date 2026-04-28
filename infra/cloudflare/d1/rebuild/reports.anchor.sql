
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
