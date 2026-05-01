import { describe, expect, it } from 'vitest'
import {
  AI_API_KEY_ENCRYPTION_VERSION,
  decryptAiApiKey,
  encryptAiApiKey,
  resolveStoredAiApiKey,
} from '../src/services/ai-key-crypto'

describe('ai key crypto', () => {
  it('encrypts api keys without storing plaintext in the payload', async () => {
    const encrypted = await encryptAiApiKey('sk-test-secret', 'test-encryption-secret')

    expect(encrypted).not.toContain('sk-test-secret')

    const payload = JSON.parse(encrypted)
    expect(payload.v).toBe(AI_API_KEY_ENCRYPTION_VERSION)

    const decrypted = await decryptAiApiKey(encrypted, 'test-encryption-secret')
    expect(decrypted).toBe('sk-test-secret')
  })

  it('rejects encrypted keys when the secret does not match', async () => {
    const encrypted = await encryptAiApiKey('sk-test-secret', 'test-encryption-secret')

    await expect(decryptAiApiKey(encrypted, 'wrong-secret')).rejects.toBeTruthy()
  })

  it('resolves encrypted keys first and keeps legacy plaintext fallback', async () => {
    const encrypted = await encryptAiApiKey('sk-encrypted-secret', 'test-encryption-secret')

    await expect(
      resolveStoredAiApiKey(
        {
          ai_api_key: 'sk-legacy-secret',
          ai_api_key_encrypted: encrypted,
        },
        'test-encryption-secret'
      )
    ).resolves.toBe('sk-encrypted-secret')

    await expect(
      resolveStoredAiApiKey(
        {
          ai_api_key: 'sk-legacy-secret',
          ai_api_key_encrypted: null,
        },
        'test-encryption-secret'
      )
    ).resolves.toBe('sk-legacy-secret')
  })
})
