PRAGMA foreign_keys = ON;

CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_unique_period
ON reports(user_id, report_type, COALESCE(period_start, ''), COALESCE(period_end, ''));
