import {
  AI_API_KEY_ENCRYPTION_VERSION,
  encryptAiApiKey,
} from './ai-key-crypto'
import { execute, queryAll } from '../utils/db'

export interface LegacyAiApiKeyRow {
  id: number
  user_id: number
  ai_provider: string | null
  ai_api_key: string | null
  ai_api_key_encrypted: string | null
  ai_api_key_encryption_version: string | null
}

export interface MigrateLegacyAiApiKeysResult {
  dryRun: boolean
  scanned: number
  migrated: number
  clearedPlaintextOnly: number
  skippedMissingSecret: number
  failed: number
  affectedUserIds: number[]
}

function normalizeLimit(value: number | null | undefined): number {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 100
  return Math.max(1, Math.min(500, Math.floor(numeric)))
}

export async function listLegacyAiApiKeyRows(
  db: D1Database,
  limit: number
): Promise<LegacyAiApiKeyRow[]> {
  return queryAll<LegacyAiApiKeyRow>(
    db,
    `
      SELECT
        id, user_id, ai_provider, ai_api_key,
        ai_api_key_encrypted, ai_api_key_encryption_version
      FROM user_settings
      WHERE ai_api_key IS NOT NULL AND trim(ai_api_key) != ''
      ORDER BY id ASC
      LIMIT ?
    `,
    [normalizeLimit(limit)]
  )
}

export async function migrateLegacyAiApiKeys(params: {
  db: D1Database
  encryptionSecret?: string | null
  dryRun?: boolean
  limit?: number
}): Promise<MigrateLegacyAiApiKeysResult> {
  const rows = await listLegacyAiApiKeyRows(params.db, normalizeLimit(params.limit))
  const affectedUserIds = [...new Set(rows.map((row) => Number(row.user_id)).filter(Number.isFinite))]
  const result: MigrateLegacyAiApiKeysResult = {
    dryRun: Boolean(params.dryRun),
    scanned: rows.length,
    migrated: 0,
    clearedPlaintextOnly: 0,
    skippedMissingSecret: 0,
    failed: 0,
    affectedUserIds,
  }

  if (params.dryRun) {
    return result
  }

  const secret = String(params.encryptionSecret || '').trim()

  for (const row of rows) {
    const plaintext = String(row.ai_api_key || '').trim()
    const encrypted = String(row.ai_api_key_encrypted || '').trim()

    try {
      if (encrypted) {
        await execute(
          params.db,
          `
            UPDATE user_settings
            SET ai_api_key = NULL, updated_at = datetime('now')
            WHERE id = ?
          `,
          [row.id]
        )
        result.clearedPlaintextOnly += 1
        continue
      }

      if (!secret) {
        result.skippedMissingSecret += 1
        continue
      }

      const encryptedApiKey = await encryptAiApiKey(plaintext, secret)
      await execute(
        params.db,
        `
          UPDATE user_settings
          SET
            ai_api_key = NULL,
            ai_api_key_encrypted = ?,
            ai_api_key_encryption_version = ?,
            updated_at = datetime('now')
          WHERE id = ?
        `,
        [encryptedApiKey, AI_API_KEY_ENCRYPTION_VERSION, row.id]
      )
      result.migrated += 1
    } catch (error) {
      console.warn(`Migrate legacy AI API key failed for user_settings.id=${row.id}:`, error)
      result.failed += 1
    }
  }

  return result
}
