PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS article_processing_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_article_id INTEGER NOT NULL UNIQUE,
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
    FOREIGN KEY (source_article_id) REFERENCES rss_articles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_article_processing_results_source_article_id
ON article_processing_results(source_article_id);

CREATE INDEX IF NOT EXISTS idx_article_processing_results_processing_version
ON article_processing_results(processing_version);

CREATE INDEX IF NOT EXISTS idx_article_processing_results_is_stale
ON article_processing_results(is_stale);
