import { Hono } from 'hono'
import { describe, expect, it, vi } from 'vitest'
import { handleApiError, createErrorResponse, ErrorCode } from '../src/utils/error-handler'

vi.mock('../src/utils/auth', () => ({
  resolveSessionUser: vi.fn(async () => null),
}))

import actionsRoutes from '../src/routes/actions'
import chatRoutes from '../src/routes/chat'
import contentRoutes from '../src/routes/content'
import dashboardRoutes from '../src/routes/dashboard'
import feedbackRoutes from '../src/routes/feedback'
import favoritesRoutes from '../src/routes/favorites'
import historyRoutes from '../src/routes/history'
import journalRoutes from '../src/routes/journal'
import notesRoutes from '../src/routes/notes'
import preferencesRoutes from '../src/routes/preferences'
import reportsRoutes from '../src/routes/reports'
import systemRoutes from '../src/routes/system'
import todosRoutes from '../src/routes/todos'

type TestBindings = {
  DB: D1Database
  ENVIRONMENT: string
  INTERNAL_API_TOKEN?: string
  SUMMARY_PROVIDER_ENABLED?: string
}

function buildApp() {
  const app = new Hono<{ Bindings: TestBindings }>()
  app.route('/api/v1/dashboard', dashboardRoutes)
  app.route('/api/v1/actions', actionsRoutes)
  app.route('/api/v1/preferences', preferencesRoutes)
  app.route('/api/v1/chat', chatRoutes)
  app.route('/api/v1/content', contentRoutes)
  app.route('/api/v1/reports', reportsRoutes)
  app.route('/api/v1/favorites', favoritesRoutes)
  app.route('/api/v1/notes', notesRoutes)
  app.route('/api/v1/todos', todosRoutes)
  app.route('/api/v1/history', historyRoutes)
  app.route('/api/v1/journal', journalRoutes)
  app.route('/api/v1/feedback', feedbackRoutes)
  app.route('/api/v1/system', systemRoutes)
  app.onError((err, c) => handleApiError(err, c))
  app.notFound((c) => c.json(createErrorResponse(ErrorCode.NOT_FOUND, 'Not found'), 404))
  return app
}

function mockEnv() {
  return {
    DB: {} as D1Database,
    ENVIRONMENT: 'test',
    INTERNAL_API_TOKEN: 'test-internal-token',
    SUMMARY_PROVIDER_ENABLED: 'false',
  }
}

const protectedCases: Array<{
  label: string
  path: string
  init?: RequestInit
}> = [
  { label: 'dashboard today', path: '/api/v1/dashboard/today' },
  { label: 'actions overview', path: '/api/v1/actions/overview' },
  { label: 'actions check-in', path: '/api/v1/actions/check-in', init: { method: 'POST' } },
  { label: 'preferences settings', path: '/api/v1/preferences/settings' },
  { label: 'chat sessions', path: '/api/v1/chat/sessions' },
  { label: 'chat session messages', path: '/api/v1/chat/sessions/1/messages' },
  { label: 'content daily digest', path: '/api/v1/content/daily-digest' },
  { label: 'content consult', path: '/api/v1/content/consult', init: { method: 'POST' } },
  { label: 'reports list', path: '/api/v1/reports' },
  { label: 'favorites list', path: '/api/v1/favorites' },
  { label: 'notes list', path: '/api/v1/notes' },
  { label: 'todos list', path: '/api/v1/todos' },
  { label: 'history list', path: '/api/v1/history' },
  { label: 'journal overview', path: '/api/v1/journal/overview' },
  { label: 'feedback list', path: '/api/v1/feedback' },
  { label: 'feedback create', path: '/api/v1/feedback', init: { method: 'POST' } },
  { label: 'system chain health', path: '/api/v1/system/chain-health' },
  { label: 'system replay tasks', path: '/api/v1/system/replay-tasks' },
  { label: 'system summary tasks', path: '/api/v1/system/summary-tasks' },
]

describe('workers auth guard coverage', () => {
  for (const testCase of protectedCases) {
    it(`returns 401 without session for ${testCase.label}`, async () => {
      const app = buildApp()
      const response = await app.request(testCase.path, testCase.init, mockEnv())

      expect(response.status).toBe(401)
      const payload = await response.json()
      expect(payload.error).toContain('Authentication required')
      expect(payload.code).toBe('AUTHENTICATION_REQUIRED')
      expect(payload.status).toBe(401)
    })
  }

  describe('error response format consistency', () => {
    it('returns structured error with all required fields', async () => {
      const app = buildApp()
      const response = await app.request('/api/v1/dashboard/today', undefined, mockEnv())

      expect(response.status).toBe(401)
      const payload = await response.json()
      expect(payload).toHaveProperty('error')
      expect(payload).toHaveProperty('code')
      expect(payload).toHaveProperty('status')
      expect(typeof payload.error).toBe('string')
      expect(typeof payload.code).toBe('string')
      expect(typeof payload.status).toBe('number')
      expect(payload.status).toBe(401)
    })

    it('returns JSON content-type for 401 errors', async () => {
      const app = buildApp()
      const response = await app.request('/api/v1/dashboard/today', undefined, mockEnv())

      expect(response.headers.get('content-type')).toContain('application/json')
    })
  })

  describe('concurrent unauthenticated requests', () => {
    it('handles multiple simultaneous 401 requests consistently', async () => {
      const app = buildApp()
      const paths = [
        '/api/v1/dashboard/today',
        '/api/v1/actions/overview',
        '/api/v1/reports',
      ]

      const responses = await Promise.all(
        paths.map((path) => app.request(path, undefined, mockEnv()))
      )

      for (const response of responses) {
        expect(response.status).toBe(401)
        const payload = await response.json()
        expect(payload.code).toBe('AUTHENTICATION_REQUIRED')
        expect(payload.status).toBe(401)
      }
    })
  })
})
