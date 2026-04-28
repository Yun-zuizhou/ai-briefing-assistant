import { HTTPException } from 'hono/http-exception'

type InternalAuthBindings = {
  INTERNAL_API_TOKEN?: string
}

function readInternalToken(authHeader: string | undefined): string | null {
  const raw = String(authHeader || '').trim()
  if (!raw) {
    return null
  }

  const [scheme, ...rest] = raw.split(/\s+/)
  if (scheme !== 'Internal') {
    return null
  }

  const token = rest.join(' ').trim()
  return token || null
}

export function requireInternalExecutorAuth(
  c: {
    env: InternalAuthBindings
    req: {
      header(name: string): string | undefined
    }
  }
): void {
  const expectedToken = String(c.env.INTERNAL_API_TOKEN || '').trim()
  if (!expectedToken) {
    throw new HTTPException(503, {
      message: 'Internal executor auth is not configured.',
    })
  }

  const actualToken = readInternalToken(c.req.header('authorization'))
  if (!actualToken || actualToken !== expectedToken) {
    throw new HTTPException(401, {
      message: 'Internal executor authorization required.',
    })
  }
}
