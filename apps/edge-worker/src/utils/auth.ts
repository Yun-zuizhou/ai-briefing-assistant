import type { Context } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { HTTPException } from 'hono/http-exception'
import { execute, queryOne } from './db'
import { maybeBootstrapDemoUser } from './demo-user-seeds'

type WorkerBindings = {
  DB: D1Database
  ENVIRONMENT: string
}

type CookieContext = Context<{ Bindings: WorkerBindings }>

type UserRow = {
  id: number
  username: string
  email: string
  nickname: string | null
  hashed_password: string
  is_active: number
}

export type AuthenticatedUser = {
  id: number
  username: string
  email: string
  nickname: string | null
}

type SessionRow = {
  id: number
  user_id: number
  username: string
  email: string
  nickname: string | null
  expires_at: string
}

type DemoIdentity = {
  email: string
  username: string
  nickname: string
}

const SESSION_COOKIE_NAME = 'jianbao_session'
const SESSION_TTL_DAYS = 30
const SESSION_TTL_SECONDS = SESSION_TTL_DAYS * 24 * 60 * 60
const DEMO_PASSWORD = 'test123456'
const DEMO_IDENTITIES: DemoIdentity[] = [
  {
    email: 'test@example.com',
    username: 'testuser',
    nickname: '测试用户',
  },
  {
    email: 'show@example.com',
    username: 'showcase_user',
    nickname: '展示用户',
  },
]

function normalizeIdentifier(value: string | null | undefined): string {
  return String(value || '').trim().toLowerCase()
}

function normalizeEmail(value: string | null | undefined): string {
  return normalizeIdentifier(value)
}

function sanitizeUsername(raw: string): string {
  const normalized = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')

  if (!normalized) {
    return 'user'
  }

  return normalized.slice(0, 24)
}

function buildDeterministicSuffix(input: string): string {
  let hash = 0
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0
  }
  return hash.toString(36).slice(0, 6) || 'local'
}

export function buildUsername(email: string, displayName?: string | null): string {
  const preferred = displayName?.trim() || email.split('@')[0] || 'user'
  const base = sanitizeUsername(preferred)
  return `${base}_${buildDeterministicSuffix(email)}`
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')
}

function randomHex(length: number): string {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')
}

async function sha256Hex(value: string): Promise<string> {
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return toHex(buffer)
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomHex(16)
  const hash = await sha256Hex(`${password}${salt}`)
  return `${salt}$${hash}`
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const [salt, storedHash] = String(hashedPassword || '').split('$')
  if (!salt || !storedHash) {
    return false
  }
  const computedHash = await sha256Hex(`${password}${salt}`)
  return computedHash === storedHash
}

export async function findUserByIdentifier(
  db: D1Database,
  identifier: string
): Promise<UserRow | null> {
  const normalized = normalizeIdentifier(identifier)
  if (!normalized) {
    return null
  }

  return queryOne<UserRow>(
    db,
    `
      SELECT id, username, email, nickname, hashed_password, is_active
      FROM users
      WHERE lower(username) = ? OR lower(email) = ?
      LIMIT 1
    `,
    [normalized, normalized]
  )
}

function mapAuthenticatedUser(user: Pick<UserRow, 'id' | 'username' | 'email' | 'nickname'>): AuthenticatedUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    nickname: user.nickname,
  }
}

function isLocalOrigin(origin: string): boolean {
  return origin.includes('localhost') || origin.includes('127.0.0.1')
}

function buildCookieOptions(c: CookieContext) {
  const env = String(c.env.ENVIRONMENT || 'development').trim().toLowerCase()
  const origin = c.req.header('origin') || ''
  const requestUrl = new URL(c.req.url)

  let isCrossSiteProduction = false
  if (env === 'production' && origin) {
    try {
      const originUrl = new URL(origin)
      isCrossSiteProduction = originUrl.host !== requestUrl.host
    } catch {
      isCrossSiteProduction = false
    }
  }

  const sameSite: 'None' | 'Lax' = isCrossSiteProduction ? 'None' : 'Lax'

  return {
    httpOnly: true,
    secure: env === 'production',
    sameSite,
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  }
}

function getClientIp(c: CookieContext): string | null {
  const forwarded = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || ''
  const first = forwarded.split(',').map((item) => item.trim()).find(Boolean)
  return first || null
}

async function createSessionRecord(
  db: D1Database,
  userId: number,
  userAgent?: string | null,
  ipAddress?: string | null
): Promise<string> {
  const rawToken = randomHex(32)
  const tokenHash = await sha256Hex(rawToken)

  await execute(
    db,
    `
      INSERT INTO user_sessions (
        user_id, token_hash, expires_at, last_seen_at, user_agent, ip_address, created_at, updated_at
      )
      VALUES (?, ?, datetime('now', '+30 days'), datetime('now'), ?, ?, datetime('now'), datetime('now'))
    `,
    [userId, tokenHash, userAgent || null, ipAddress || null]
  )

  return rawToken
}

export async function createUserSession(
  c: CookieContext,
  userId: number
): Promise<void> {
  const rawToken = await createSessionRecord(
    c.env.DB,
    userId,
    c.req.header('user-agent'),
    getClientIp(c)
  )
  setCookie(c, SESSION_COOKIE_NAME, rawToken, buildCookieOptions(c))
}

export async function clearUserSession(c: CookieContext): Promise<void> {
  const rawToken = getCookie(c, SESSION_COOKIE_NAME)
  if (rawToken) {
    const tokenHash = await sha256Hex(rawToken)
    await execute(
      c.env.DB,
      `DELETE FROM user_sessions WHERE token_hash = ?`,
      [tokenHash]
    )
  }
  deleteCookie(c, SESSION_COOKIE_NAME, { path: '/' })
}

export async function resolveSessionUser(
  c: CookieContext
): Promise<AuthenticatedUser | null> {
  const rawToken = getCookie(c, SESSION_COOKIE_NAME)
  if (!rawToken) {
    return null
  }

  const tokenHash = await sha256Hex(rawToken)
  const session = await queryOne<SessionRow>(
    c.env.DB,
    `
      SELECT
        s.id,
        s.user_id,
        s.expires_at,
        u.username,
        u.email,
        u.nickname
      FROM user_sessions s
      INNER JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ?
        AND datetime(s.expires_at) > datetime('now')
        AND u.is_active = 1
      LIMIT 1
    `,
    [tokenHash]
  )

  if (!session) {
    await execute(
      c.env.DB,
      `DELETE FROM user_sessions WHERE token_hash = ?`,
      [tokenHash]
    )
    deleteCookie(c, SESSION_COOKIE_NAME, { path: '/' })
    return null
  }

  await execute(
    c.env.DB,
    `
      UPDATE user_sessions
      SET last_seen_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `,
    [session.id]
  )

  return {
    id: session.user_id,
    username: session.username,
    email: session.email,
    nickname: session.nickname,
  }
}

export async function requireSessionUser(
  c: CookieContext
): Promise<AuthenticatedUser> {
  const user = await resolveSessionUser(c)
  if (!user) {
    throw new HTTPException(401, { message: 'Authentication required. Please log in.' })
  }
  return user
}

function resolveDemoIdentity(identifier: string): DemoIdentity | null {
  const normalized = normalizeIdentifier(identifier)
  return DEMO_IDENTITIES.find((item) =>
    normalizeIdentifier(item.email) === normalized || normalizeIdentifier(item.username) === normalized
  ) || null
}

export async function ensureDemoAuthUser(
  db: D1Database,
  identifier: string,
  environment: string
): Promise<void> {
  if (String(environment || '').toLowerCase() === 'production') {
    return
  }

  const demoIdentity = resolveDemoIdentity(identifier)
  if (!demoIdentity) {
    return
  }

  const hashedPassword = await hashPassword(DEMO_PASSWORD)
  const existing = await queryOne<{ id: number }>(
    db,
    `
      SELECT id
      FROM users
      WHERE lower(email) = ? OR lower(username) = ?
      LIMIT 1
    `,
    [normalizeEmail(demoIdentity.email), normalizeIdentifier(demoIdentity.username)]
  )

  if (!existing?.id) {
    await execute(
      db,
      `
        INSERT INTO users (
          username, email, hashed_password, nickname, is_active, is_superuser, interests, created_at, updated_at, last_login
        )
        VALUES (?, ?, ?, ?, 1, 0, '[]', datetime('now'), datetime('now'), datetime('now'))
      `,
      [demoIdentity.username, demoIdentity.email, hashedPassword, demoIdentity.nickname]
    )

    const created = await queryOne<{ id: number }>(
      db,
      `SELECT id FROM users WHERE lower(email) = ? LIMIT 1`,
      [normalizeEmail(demoIdentity.email)]
    )

    if (created?.id) {
      await maybeBootstrapDemoUser(db, created.id, demoIdentity.email)
    }
    return
  }

  await execute(
    db,
    `
      UPDATE users
      SET username = ?, email = ?, hashed_password = ?, nickname = ?, is_active = 1, updated_at = datetime('now')
      WHERE id = ?
    `,
    [demoIdentity.username, demoIdentity.email, hashedPassword, demoIdentity.nickname, existing.id]
  )
  await maybeBootstrapDemoUser(db, existing.id, demoIdentity.email)
}

export function validateEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function publicUser(user: Pick<UserRow, 'id' | 'username' | 'email' | 'nickname'>): AuthenticatedUser {
  return mapAuthenticatedUser(user)
}
