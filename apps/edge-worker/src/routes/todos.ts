import { Hono } from 'hono'
import {
  completeTodoAction,
  createTodoAction,
  deleteTodoAction,
  getTodoRow,
  getTodoRowById,
  listTodoRows,
  mapTodoResponse,
  updateTodoAction,
} from '../services/behavior'
import { InvalidReferenceError, normalizeTodoRelatedRef } from '../services/reference-registry'
import { resolveUserId } from '../utils/request-user'

type Bindings = {
  DB: D1Database
  ENVIRONMENT: string
}

const router = new Hono<{ Bindings: Bindings }>()

router.get('/', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)
  const status = c.req.query('status')
  const priority = c.req.query('priority')
  const limit = parseInt(c.req.query('limit') || '20')
  const offset = parseInt(c.req.query('offset') || '0')

  try {
    const allItems = await listTodoRows(db, { userId, status, priority })
    const items = allItems.slice(offset, offset + limit)

    return c.json({
      total: allItems.length,
      items: items.map(mapTodoResponse),
    })
  } catch (error) {
    console.error('Get todos error:', error)
    return c.json({ total: 0, items: [] })
  }
})

router.post('/', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)

  try {
    const body = await c.req.json<{
      content: string
      description?: string
      priority?: string
      deadline?: string
      related_type?: string
      related_id?: number
      related_title?: string
      tags?: string[]
    }>()
    const payload = { ...body }
    if (body.related_type !== undefined || body.related_id !== undefined) {
      const relatedRef = normalizeTodoRelatedRef(body.related_type ?? null, body.related_id ?? null)
      payload.related_type = relatedRef.relatedType ?? undefined
      payload.related_id = relatedRef.relatedId ?? undefined
    }
    const created = await createTodoAction({ db, userId, payload })
    if (!created) {
      return c.json({ error: 'Failed to create todo' }, 500)
    }
    return c.json(mapTodoResponse(created))
  } catch (error) {
    if (error instanceof InvalidReferenceError) {
      return c.json({ error: error.message }, 400)
    }
    console.error('Create todo error:', error)
    return c.json({ error: 'Failed to create todo' }, 500)
  }
})

router.get('/:id', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)
  const todoId = parseInt(c.req.param('id'))

  try {
    const todo = await getTodoRow(db, todoId, userId)

    if (!todo) {
      const foreignTodo = await getTodoRowById(db, todoId)
      if (foreignTodo) {
        return c.json({ error: '无权访问该待办' }, 403)
      }
      return c.json({ error: '待办不存在' }, 404)
    }

    return c.json(mapTodoResponse(todo))
  } catch (error) {
    console.error('Get todo error:', error)
    return c.json({ error: 'Failed to load todo' }, 500)
  }
})

router.put('/:id', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)
  const todoId = parseInt(c.req.param('id'))

  try {
    const body = await c.req.json<{
      content?: string
      description?: string
      status?: string
      priority?: string
      deadline?: string
      related_type?: string | null
      related_id?: number | null
      related_title?: string | null
      tags?: string[]
    }>()
    const payload = { ...body }
    if (body.related_type !== undefined || body.related_id !== undefined) {
      const relatedRef = normalizeTodoRelatedRef(body.related_type ?? null, body.related_id ?? null)
      payload.related_type = relatedRef.relatedType
      payload.related_id = relatedRef.relatedId
    }

    const existing = await getTodoRow(db, todoId, userId)

    if (!existing) {
      const foreignTodo = await getTodoRowById(db, todoId)
      if (foreignTodo) {
        return c.json({ error: '无权修改该待办' }, 403)
      }
      return c.json({ error: '待办不存在' }, 404)
    }
    const updated = await updateTodoAction({ db, todo: existing, payload })
    if (!updated) {
      return c.json({ error: 'Failed to update todo' }, 500)
    }
    return c.json(mapTodoResponse(updated))
  } catch (error) {
    if (error instanceof InvalidReferenceError) {
      return c.json({ error: error.message }, 400)
    }
    console.error('Update todo error:', error)
    return c.json({ error: 'Failed to update todo' }, 500)
  }
})

router.delete('/:id', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)
  const todoId = parseInt(c.req.param('id'))

  try {
    const existing = await getTodoRow(db, todoId, userId)

    if (!existing) {
      const foreignTodo = await getTodoRowById(db, todoId)
      if (foreignTodo) {
        return c.json({ error: '无权删除该待办' }, 403)
      }
      return c.json({ error: '待办不存在' }, 404)
    }

    await deleteTodoAction({ db, todoId })

    return c.json({ success: true, message: '待办已删除' })
  } catch (error) {
    console.error('Delete todo error:', error)
    return c.json({ error: 'Failed to delete todo' }, 500)
  }
})

router.post('/:id/complete', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)
  const todoId = parseInt(c.req.param('id'))

  try {
    const existing = await getTodoRow(db, todoId, userId)

    if (!existing) {
      const foreignTodo = await getTodoRowById(db, todoId)
      if (foreignTodo) {
        return c.json({ error: '无权完成该待办' }, 403)
      }
      return c.json({ error: '待办不存在' }, 404)
    }
    const completed = await completeTodoAction({ db, todo: existing })
    if (!completed) {
      return c.json({ error: 'Failed to complete todo' }, 500)
    }
    return c.json(mapTodoResponse(completed))
  } catch (error) {
    console.error('Complete todo error:', error)
    return c.json({ error: 'Failed to complete todo' }, 500)
  }
})

export default router
