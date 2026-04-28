export const TEST_SESSION_COOKIE = 'jianbao_session=test-session'
export const TEST_INTERNAL_TOKEN = 'test-internal-token'

export const TEST_SESSION_USER = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  nickname: '测试用户',
}

type SessionAwareContext = {
  req: {
    header(name: string): string | undefined
  }
}

export async function resolveSessionUserFromCookie(c: SessionAwareContext) {
  const cookie = c.req.header('cookie') || ''
  if (!cookie.includes(TEST_SESSION_COOKIE)) {
    return null
  }
  return TEST_SESSION_USER
}

export function withSession(init: RequestInit = {}): RequestInit {
  const headers = new Headers(init.headers || {})
  headers.set('cookie', TEST_SESSION_COOKIE)

  return {
    ...init,
    headers,
  }
}

export function withInternalToken(init: RequestInit = {}): RequestInit {
  const headers = new Headers(init.headers || {})
  headers.set('authorization', `Internal ${TEST_INTERNAL_TOKEN}`)

  return {
    ...init,
    headers,
  }
}
