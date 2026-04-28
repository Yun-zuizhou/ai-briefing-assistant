import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { resolveSessionUser } from './auth'

type WorkerBindings = {
  DB: D1Database
  ENVIRONMENT: string
}

export async function resolveUserId(
  c: Context<{ Bindings: WorkerBindings }>
): Promise<number> {
  const sessionUser = await resolveSessionUser(c)
  if (sessionUser) {
    return sessionUser.id
  }

  throw new HTTPException(401, {
    message: 'Authentication required. Sign in first.',
  })
}
