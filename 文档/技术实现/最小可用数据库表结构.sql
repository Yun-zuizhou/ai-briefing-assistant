-- AI简报助手（时代与我）
-- 最小可用数据库表结构
-- 设计依据：
-- 1. 文档/项目核心总纲.md
-- 2. 文档/项目功能文档.md
-- 3. 当前已落地的最小数据事实层与现有代码实体
--
-- 目标：
-- - 优先支持“今日信息 -> 行动转化 -> 自我记录 -> 周期回顾”主闭环
-- - 以 Cloudflare D1 / SQLite 可执行为准
-- - 不做过度设计，尽量少用 JSON、枚举、触发器、视图、存储过程

PRAGMA foreign_keys = ON;

-- =========================
-- 1. 用户与基础配置
-- =========================

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    nickname TEXT,
    avatar_url TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_interests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    interest_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (user_id, interest_name)
);

CREATE TABLE IF NOT EXISTS user_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    morning_brief_time TEXT DEFAULT '08:00',
    evening_brief_time TEXT DEFAULT '21:00',
    do_not_disturb_start TEXT,
    do_not_disturb_end TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =========================
-- 2. 内容与机会
-- =========================

CREATE TABLE IF NOT EXISTS contents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_type TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    content TEXT,
    source_name TEXT NOT NULL,
    source_url TEXT NOT NULL UNIQUE,
    author_name TEXT,
    category_name TEXT,
    published_at TEXT,
    hot_score INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS opportunities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    summary TEXT,
    content TEXT,
    source_name TEXT NOT NULL,
    source_url TEXT NOT NULL UNIQUE,
    opportunity_type TEXT NOT NULL,
    reward_text TEXT,
    location TEXT,
    is_remote INTEGER NOT NULL DEFAULT 0,
    deadline TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- 3. 今日简报与报告
-- =========================

CREATE TABLE IF NOT EXISTS briefings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    brief_date TEXT NOT NULL,
    brief_type TEXT NOT NULL,
    issue_number INTEGER,
    title TEXT NOT NULL,
    summary_text TEXT,
    status TEXT NOT NULL DEFAULT 'ready',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (user_id, brief_date, brief_type)
);

CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    report_type TEXT NOT NULL,
    period_start TEXT,
    period_end TEXT,
    title TEXT NOT NULL,
    summary_text TEXT,
    status TEXT NOT NULL DEFAULT 'ready',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =========================
-- 4. 行动中心
-- =========================

CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    priority TEXT NOT NULL DEFAULT 'medium',
    due_at TEXT,
    source_type TEXT,
    source_id INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    item_type TEXT NOT NULL,
    item_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    source_name TEXT,
    source_url TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS opportunity_follows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    opportunity_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'following',
    note TEXT,
    next_step TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE,
    UNIQUE (user_id, opportunity_id)
);

-- =========================
-- 5. 记录与成长沉淀
-- =========================

CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    source_type TEXT NOT NULL DEFAULT 'manual',
    source_id INTEGER,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS history_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    event_type TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    ref_type TEXT,
    ref_id INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    persona_summary TEXT,
    profile_version TEXT,
    generated_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =========================
-- 6. 必要索引
-- =========================

CREATE INDEX IF NOT EXISTS idx_user_interests_user_id
ON user_interests(user_id);

CREATE INDEX IF NOT EXISTS idx_user_interests_interest_name
ON user_interests(interest_name);

CREATE INDEX IF NOT EXISTS idx_contents_type_status
ON contents(content_type, status);

CREATE INDEX IF NOT EXISTS idx_contents_published_at
ON contents(published_at);

CREATE INDEX IF NOT EXISTS idx_opportunities_status_deadline
ON opportunities(status, deadline);

CREATE INDEX IF NOT EXISTS idx_briefings_user_date
ON briefings(user_id, brief_date);

CREATE INDEX IF NOT EXISTS idx_reports_user_type
ON reports(user_id, report_type);

CREATE INDEX IF NOT EXISTS idx_todos_user_status
ON todos(user_id, status);

CREATE INDEX IF NOT EXISTS idx_todos_due_at
ON todos(due_at);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id
ON favorites(user_id);

CREATE INDEX IF NOT EXISTS idx_favorites_item
ON favorites(item_type, item_id);

CREATE INDEX IF NOT EXISTS idx_opportunity_follows_user_status
ON opportunity_follows(user_id, status);

CREATE INDEX IF NOT EXISTS idx_notes_user_created_at
ON notes(user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_history_entries_user_created_at
ON history_entries(user_id, created_at);
