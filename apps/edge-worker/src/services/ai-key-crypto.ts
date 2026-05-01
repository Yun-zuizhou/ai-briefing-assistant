const ENCRYPTION_VERSION = 'aes-gcm-v1'
const AES_GCM_IV_BYTES = 12

export type AiApiKeyEncryptedPayload = {
  v: typeof ENCRYPTION_VERSION
  iv: string
  data: string
}

type StoredAiApiKeyFields = {
  ai_api_key?: string | null
  ai_api_key_encrypted?: string | null
}

function normalizeSecret(secret: string | null | undefined): string {
  return String(secret || '').trim()
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

async function deriveAesKey(secret: string): Promise<CryptoKey> {
  const normalized = normalizeSecret(secret)
  if (!normalized) {
    throw new Error('AI_KEY_ENCRYPTION_SECRET 未配置，无法安全保存 API Key。')
  }

  const material = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized))
  return crypto.subtle.importKey('raw', material, 'AES-GCM', false, ['encrypt', 'decrypt'])
}

export async function encryptAiApiKey(apiKey: string, secret: string | null | undefined): Promise<string> {
  const normalizedKey = String(apiKey || '').trim()
  if (!normalizedKey) {
    throw new Error('API Key 不能为空。')
  }

  const key = await deriveAesKey(secret || '')
  const iv = crypto.getRandomValues(new Uint8Array(AES_GCM_IV_BYTES))
  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    new TextEncoder().encode(normalizedKey)
  )

  const payload: AiApiKeyEncryptedPayload = {
    v: ENCRYPTION_VERSION,
    iv: bytesToBase64(iv),
    data: bytesToBase64(new Uint8Array(encrypted)),
  }

  return JSON.stringify(payload)
}

export async function decryptAiApiKey(
  encryptedValue: string,
  secret: string | null | undefined
): Promise<string | null> {
  const normalizedEncryptedValue = String(encryptedValue || '').trim()
  if (!normalizedEncryptedValue) return null

  const key = await deriveAesKey(secret || '')
  const payload = JSON.parse(normalizedEncryptedValue) as Partial<AiApiKeyEncryptedPayload>
  if (payload.v !== ENCRYPTION_VERSION || !payload.iv || !payload.data) {
    throw new Error('AI API Key 加密载荷版本不受支持。')
  }

  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: base64ToBytes(payload.iv),
    },
    key,
    base64ToBytes(payload.data)
  )

  return new TextDecoder().decode(decrypted)
}

export async function resolveStoredAiApiKey(
  settings: StoredAiApiKeyFields | null | undefined,
  secret: string | null | undefined
): Promise<string | null> {
  const encryptedValue = String(settings?.ai_api_key_encrypted || '').trim()
  if (encryptedValue) {
    try {
      return await decryptAiApiKey(encryptedValue, secret)
    } catch (error) {
      console.warn('Decrypt user AI API key failed; ignoring encrypted key:', error)
      return null
    }
  }

  const legacyPlaintextKey = String(settings?.ai_api_key || '').trim()
  return legacyPlaintextKey || null
}

export const AI_API_KEY_ENCRYPTION_VERSION = ENCRYPTION_VERSION
