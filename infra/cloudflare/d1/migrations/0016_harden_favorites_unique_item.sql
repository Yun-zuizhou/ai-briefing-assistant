PRAGMA foreign_keys = ON;

CREATE UNIQUE INDEX IF NOT EXISTS idx_favorites_unique_item
ON favorites(user_id, item_type, item_id);
