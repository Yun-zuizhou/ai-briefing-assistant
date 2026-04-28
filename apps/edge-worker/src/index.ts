import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { handleApiError, createErrorResponse, ErrorCode } from './utils/error-handler'
import authRoutes from './routes/auth'
import dashboardRoutes from './routes/dashboard'
import actionsRoutes from './routes/actions'
import contentRoutes, { getHotTopicsHandler, getOpportunitiesHandler } from './routes/content'
import preferencesRoutes from './routes/preferences'
import chatRoutes from './routes/chat'
import reportsRoutes from './routes/reports'
import favoritesRoutes from './routes/favorites'
import notesRoutes from './routes/notes'
import todosRoutes from './routes/todos'
import historyRoutes from './routes/history'
import journalRoutes from './routes/journal'
import feedbackRoutes from './routes/feedback'
import systemRoutes from './routes/system'

type Bindings = {
  DB: D1Database
  ENVIRONMENT: string
  REQUEST_LOGGING?: string
  ERROR_LOGGING?: string
  SUMMARY_PROVIDER_ENABLED?: string
  SUMMARY_PROVIDER_API_URL?: string
  SUMMARY_PROVIDER_API_KEY?: string
  SUMMARY_PROVIDER_MODEL?: string
  SUMMARY_PROVIDER_DEBUG_FALLBACK?: string
  CORS_ORIGINS?: string
}

const app = new Hono<{ Bindings: Bindings }>()
const requestLogger = logger()

function isTruthy(value: string | undefined): boolean {
  return ['1', 'true', 'yes', 'on'].includes(String(value || '').toLowerCase())
}

function isFalsy(value: string | undefined): boolean {
  return ['0', 'false', 'no', 'off'].includes(String(value || '').toLowerCase())
}

function shouldLogRequests(c: { env: Bindings }): boolean {
  if (isTruthy(c.env.REQUEST_LOGGING)) {
    return true
  }
  if (isFalsy(c.env.REQUEST_LOGGING)) {
    return false
  }
  return c.env.ENVIRONMENT !== 'development'
}

function parseCorsOrigins(value: string | undefined): string[] {
  const raw = String(value || '').trim()
  if (!raw) {
    return [
      'http://127.0.0.1:5173',
      'http://localhost:5173',
      'https://ai-briefing-assistant.aibriefing2026.workers.dev',
    ]
  }

  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean)
    }
  } catch {
    // fall through to comma split
  }

  return raw.split(',').map((item) => item.trim()).filter(Boolean)
}

app.use('*', async (c, next) => {
  if (shouldLogRequests(c)) {
    return requestLogger(c, next)
  }
  return next()
})
app.use('*', cors({
  origin: (origin, c) => {
    const allowedOrigins = parseCorsOrigins(c.env.CORS_ORIGINS)
    if (!origin) {
      return allowedOrigins[0] || '*'
    }
    if (allowedOrigins.includes(origin)) {
      return origin
    }
    return allowedOrigins[0] || origin
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))

app.get('/', (c) => {
  return c.json({
    message: 'AI简报助手 API',
    version: '1.0.0',
    docs: '/docs',
    environment: c.env.ENVIRONMENT,
  })
})

app.get('/health', (c) => {
  return c.json({ status: 'healthy' })
})

app.route('/api/v1/auth', authRoutes)
app.route('/api/v1/dashboard', dashboardRoutes)
app.route('/api/v1/actions', actionsRoutes)
app.route('/api/v1/content', contentRoutes)
app.get('/api/v1/hot-topics', getHotTopicsHandler)
app.get('/api/v1/opportunities', getOpportunitiesHandler)
app.route('/api/v1/preferences', preferencesRoutes)
app.route('/api/v1/chat', chatRoutes)
app.route('/api/v1/reports', reportsRoutes)
app.route('/api/v1/favorites', favoritesRoutes)
app.route('/api/v1/notes', notesRoutes)
app.route('/api/v1/todos', todosRoutes)
app.route('/api/v1/history', historyRoutes)
app.route('/api/v1/journal', journalRoutes)
app.route('/api/v1/feedback', feedbackRoutes)
app.route('/api/v1/system', systemRoutes)

app.notFound((c) => {
  return c.json(createErrorResponse(ErrorCode.NOT_FOUND, 'The requested endpoint was not found.'), 404)
})

app.onError((err, c) => {
  return handleApiError(err, c)
})

export default app
