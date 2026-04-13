PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS hot_topic_processing_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_hot_topic_id INTEGER NOT NULL UNIQUE,
    source_content_ref TEXT NOT NULL UNIQUE,
    normalized_title TEXT NOT NULL,
    normalized_summary TEXT,
    normalized_category_labels_json TEXT NOT NULL DEFAULT '[]',
    normalized_tags_json TEXT NOT NULL DEFAULT '[]',
    quality_score REAL NOT NULL DEFAULT 0,
    published_at TEXT,
    processing_version TEXT NOT NULL,
    processed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_stale INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (source_hot_topic_id) REFERENCES hot_topics(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_hot_topic_processing_results_source_hot_topic_id
ON hot_topic_processing_results(source_hot_topic_id);

CREATE INDEX IF NOT EXISTS idx_hot_topic_processing_results_processing_version
ON hot_topic_processing_results(processing_version);

CREATE INDEX IF NOT EXISTS idx_hot_topic_processing_results_is_stale
ON hot_topic_processing_results(is_stale);
