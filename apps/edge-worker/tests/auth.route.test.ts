import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const dbMocks = vi.hoisted(() => ({
  queryOne: vi.fn(),
  execute: vi.fn(),
}))

const authState = vi.hoisted(() => {
  let currentUser: { id: number; username: string; email: string; nickname: string | null } | null = null

  return {
    getCurrentUser: () => currentUser,
    setCurrentUser: (user: { id: number; username: string; email: string; nickname: string | null } | null) => {
      currentUser = user
    },
    reset: () => {
      currentUser = null
    },
  }
})

const authMocks = vi.hoisted(() => ({
  clearUserSession: vi.fn(async () => {
    authState.setCurrentUser(null)
  }),
  createUserSession: vi.fn(async () => {}),
  ensureDemoAuthUser: vi.fn(async () => {}),
  findUserByIdentifier: vi.fn(),
  hashPassword: vi.fn(async () => 'salt$hash'),
  publicUser: vi.fn((user: { id: number; username: string; email: string; nickname: string | null }) => ({
    id: user.id,
    username: user.username,
    email: user.email,
    nickname: user.nickname,
  })),
  requireSessionUser: vi.fn(async () => {
    const user = authState.getCurrentUser()
    if (!user) {
      throw new HTTPException(401, { message: 'Authentication required' })
    }
    return user
  }),
  validateEmail: vi.fn((value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)),
  verifyPassword: vi.fn(async () => true),
}))

vi.mock('../src/utils/db', () => ({
  queryOne: dbMocks.queryOne,
  execute: dbMocks.execute,
}))

vi.mock('../src/utils/auth', () => ({
  clearUserSession: authMocks.clearUserSession,
  createUserSession: authMocks.createUserSession,
  ensureDemoAuthUser: authMocks.ensureDemoAuthUser,
  findUserByIdentifier: authMocks.findUserByIdentifier,
  hashPassword: authMocks.hashPassword,
  publicUser: authMocks.publicUser,
  requireSessionUser: authMocks.requireSessionUser,
  validateEmail: authMocks.validateEmail,
  verifyPassword: authMocks.verifyPassword,
}))

import authRoutes from '../src/routes/auth'

type TestBindings = {
  DB: D1Database
  ENVIRONMENT: string
}

function buildApp() {
  const app = new Hono<{ Bindings: TestBindings }>()
  app.route('/api/v1/auth', authRoutes)
  return app
}

function mockEnv() {
  return {
    DB: {} as D1Database,
    ENVIRONMENT: 'test',
  }
}

describe('workers auth routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authState.reset()
    dbMocks.queryOne.mockResolvedValue(null)
    dbMocks.execute.mockResolvedValue({ success: true, meta: { last_row_id: 1 } })
    authMocks.findUserByIdentifier.mockResolvedValue(null)
  })

  it('registers a user, exposes it via /me, then clears session on logout', async () => {
    dbMocks.queryOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 1,
        username: 'newuser',
        email: 'new@example.com',
        nickname: '新用户',
        hashed_password: 'salt$hash',
        is_active: 1,
      })

    authMocks.createUserSession.mockImplementation(async (_c, userId: number) => {
      authState.setCurrentUser({
        id: userId,
        username: 'newuser',
        email: 'new@example.com',
        nickname: '新用户',
      })
    })

    const app = buildApp()

    const registerResponse = await app.request(
      '/api/v1/auth/register',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          username: 'newuser',
          email: 'new@example.com',
          password: '123456',
          nickname: '新用户',
        }),
      },
      mockEnv()
    )

    expect(registerResponse.status).toBe(200)
    const registerPayload = await registerResponse.json()
    expect(registerPayload.user).toMatchObject({
      id: 1,
      username: 'newuser',
      email: 'new@example.com',
    })

    const meResponse = await app.request('/api/v1/auth/me', {}, mockEnv())
    expect(meResponse.status).toBe(200)
    const mePayload = await meResponse.json()
    expect(mePayload.user.email).toBe('new@example.com')

    const logoutResponse = await app.request('/api/v1/auth/logout', { method: 'POST' }, mockEnv())
    expect(logoutResponse.status).toBe(200)

    const meAfterLogout = await app.request('/api/v1/auth/me', {}, mockEnv())
    expect(meAfterLogout.status).toBe(401)

    const insertedUser = dbMocks.execute.mock.calls.some((args) =>
      String(args[1]).includes('INSERT INTO users')
    )
    expect(insertedUser).toBe(true)
  })

  it('logs in an active user and updates last_login timestamp', async () => {
    authMocks.findUserByIdentifier.mockResolvedValue({
      id: 9,
      username: 'tester',
      email: 'tester@example.com',
      nickname: '测试用户',
      hashed_password: 'salt$hash',
      is_active: 1,
    })

    authMocks.createUserSession.mockImplementation(async (_c, userId: number) => {
      authState.setCurrentUser({
        id: userId,
        username: 'tester',
        email: 'tester@example.com',
        nickname: '测试用户',
      })
    })

    const app = buildApp()
    const response = await app.request(
      '/api/v1/auth/login',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          identifier: 'tester@example.com',
          password: '123456',
        }),
      },
      mockEnv()
    )

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.user.username).toBe('tester')
    expect(authMocks.ensureDemoAuthUser).toHaveBeenCalled()
    expect(authMocks.verifyPassword).toHaveBeenCalledWith('123456', 'salt$hash')

    const updatedLoginAt = dbMocks.execute.mock.calls.some((args) =>
      String(args[1]).includes('UPDATE users SET last_login')
    )
    expect(updatedLoginAt).toBe(true)
  })

  it('returns 401 when password verification fails', async () => {
    authMocks.findUserByIdentifier.mockResolvedValue({
      id: 9,
      username: 'tester',
      email: 'tester@example.com',
      nickname: '测试用户',
      hashed_password: 'salt$hash',
      is_active: 1,
    })
    authMocks.verifyPassword.mockResolvedValueOnce(false)

    const app = buildApp()
    const response = await app.request(
      '/api/v1/auth/login',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          identifier: 'tester@example.com',
          password: 'wrong-password',
        }),
      },
      mockEnv()
    )

    expect(response.status).toBe(401)
    const payload = await response.json()
    expect(payload.error).toContain('用户名、邮箱或密码错误')
  })
})
