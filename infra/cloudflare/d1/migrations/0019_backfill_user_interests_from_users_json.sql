PRAGMA foreign_keys = ON;

INSERT INTO user_interests (
    user_id,
    interest_name,
    status,
    created_at,
    updated_at
)
SELECT
    u.id AS user_id,
    TRIM(CAST(j.value AS TEXT)) AS interest_name,
    'active' AS status,
    COALESCE(u.updated_at, u.created_at, CURRENT_TIMESTAMP) AS created_at,
    COALESCE(u.updated_at, u.created_at, CURRENT_TIMESTAMP) AS updated_at
FROM users u,
     json_each(
         CASE
             WHEN json_valid(COALESCE(NULLIF(u.interests, ''), '[]'))
                 THEN COALESCE(NULLIF(u.interests, ''), '[]')
             ELSE '[]'
         END
     ) AS j
WHERE TRIM(CAST(j.value AS TEXT)) <> ''
ON CONFLICT(user_id, interest_name) DO UPDATE SET
    status = 'active',
    updated_at = COALESCE(excluded.updated_at, CURRENT_TIMESTAMP);
