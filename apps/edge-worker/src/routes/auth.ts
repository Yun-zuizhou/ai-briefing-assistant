import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { execute, queryOne } from '../utils/db'
import {
  clearUserSession,
  createUserSession,
  ensureDemoAuthUser,
  findUserByIdentifier,
  hashPassword,
  publicUser,
  requireSessionUser,
  validateEmail,
  verifyPassword,
} from '../utils/auth'

type Bindings = {
  DB: D1Database
  ENVIRONMENT: string
}

type UserRow = {
  id: number
  username: string
  email: string
  nickname: string | null
  hashed_password: string
  is_active: number
}

const router = new Hono<{ Bindings: Bindings }>()

function normalizeIdentifier(value: string | undefined): string {
  return String(value || '').trim()
}

function normalizeUsername(value: string): string {
  return value.trim().toLowerCase()
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

router.post('/register', async (c) => {
  const db = c.env.DB

  try {
    const body = await c.req.json<{
      username?: string
      email?: string
      password?: string
      nickname?: string | null
    }>()

    const username = normalizeUsername(String(body.username || ''))
    const email = normalizeEmail(String(body.email || ''))
    const password = String(body.password || '')
    const nickname = String(body.nickname || body.username || '').trim() || null

    if (!username || username.length < 2) {
      return c.json({ error: '用户名至少需要 2 个字符' }, 400)
    }
    if (!validateEmail(email)) {
      return c.json({ error: '邮箱格式不正确' }, 400)
    }
    if (password.length < 6) {
      return c.json({ error: '密码至少需要 6 个字符' }, 400)
    }

    const existing = await queryOne<{ id: number }>(
      db,
      `
        SELECT id
        FROM users
        WHERE lower(username) = ? OR lower(email) = ?
        LIMIT 1
      `,
      [username, email]
    )

    if (existing?.id) {
      return c.json({ error: '用户名或邮箱已存在' }, 400)
    }

    const hashedPassword = await hashPassword(password)

    await execute(
      db,
      `
        INSERT INTO users (
          username, email, hashed_password, nickname, is_active, is_superuser, interests, created_at, updated_at, last_login
        )
        VALUES (?, ?, ?, ?, 1, 0, '[]', datetime('now'), datetime('now'), datetime('now'))
      `,
      [username, email, hashedPassword, nickname]
    )

    const createdUser = await queryOne<UserRow>(
      db,
      `
        SELECT id, username, email, nickname, hashed_password, is_active
        FROM users
        WHERE lower(email) = ?
        LIMIT 1
      `,
      [email]
    )

    if (!createdUser?.id) {
      return c.json({ error: '用户创建失败' }, 500)
    }

    await createUserSession(c, createdUser.id)
    return c.json({
      user: publicUser(createdUser),
    })
  } catch (error) {
    console.error('Register error:', error)
    return c.json({ error: '注册失败' }, 500)
  }
})

router.post('/login', async (c) => {
  const db = c.env.DB

  try {
    const body = await c.req.json<{
      identifier?: string
      username?: string
      email?: string
      password?: string
    }>()

    const identifier = normalizeIdentifier(body.identifier || body.email || body.username)
    const password = String(body.password || '')

    if (!identifier) {
      return c.json({ error: '请输入用户名或邮箱' }, 400)
    }
    if (!password) {
      return c.json({ error: '请输入密码' }, 400)
    }

    await ensureDemoAuthUser(db, identifier, c.env.ENVIRONMENT)

    const user = await findUserByIdentifier(db, identifier)
    if (!user) {
      return c.json({ error: '用户名、邮箱或密码错误' }, 401)
    }
    if (!user.is_active) {
      return c.json({ error: '当前用户已被禁用' }, 403)
    }

    const passwordMatches = await verifyPassword(password, user.hashed_password)
    if (!passwordMatches) {
      return c.json({ error: '用户名、邮箱或密码错误' }, 401)
    }

    await execute(
      db,
      `UPDATE users SET last_login = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
      [user.id]
    )
    await createUserSession(c, user.id)

    return c.json({
      user: publicUser(user),
    })
  } catch (error) {
    console.error('Login error:', error)
    return c.json({ error: '登录失败' }, 500)
  }
})

router.get('/me', async (c) => {
  try {
    const user = await requireSessionUser(c)
    return c.json({ user })
  } catch (error) {
    if (error instanceof HTTPException) {
      return c.json({ error: '未登录' }, 401)
    }
    console.error('Get current user error:', error)
    return c.json({ error: '读取当前登录态失败' }, 500)
  }
})

router.post('/logout', async (c) => {
  try {
    await clearUserSession(c)
    return c.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return c.json({ error: '退出登录失败' }, 500)
  }
})

export default router
