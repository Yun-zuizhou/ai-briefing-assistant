import { execute } from '../../utils/db'

export async function replaceUserInterests(
  db: D1Database,
  userId: number,
  interests: string[]
): Promise<string[]> {
  const normalized = Array.from(
    new Set(
      interests
        .map((interest) => String(interest).trim())
        .filter(Boolean)
    )
  )

  await execute(db, `DELETE FROM user_interests WHERE user_id = ?`, [userId])

  for (const interest of normalized) {
    await execute(
      db,
      `INSERT INTO user_interests (user_id, interest_name, status, created_at) VALUES (?, ?, 'active', datetime('now'))`,
      [userId, interest]
    )
  }

  return normalized
}
