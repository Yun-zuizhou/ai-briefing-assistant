import { Hono } from 'hono'
import {
  createNoteAction,
  deleteNoteAction,
  getNoteRow,
  getNoteRowById,
  listNoteRows,
  mapNoteResponse,
  updateNoteAction,
} from '../services/behavior'
import { resolveUserId } from '../utils/request-user'

type Bindings = {
  DB: D1Database
  ENVIRONMENT: string
}

const router = new Hono<{ Bindings: Bindings }>()

router.get('/', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)
  const sourceType = c.req.query('source_type')

  try {
    const items = await listNoteRows(db, userId, sourceType)

    return c.json({
      total: items.length,
      items: items.map(mapNoteResponse),
    })
  } catch (error) {
    console.error('Get notes error:', error)
    return c.json({ error: 'Failed to load notes' }, 500)
  }
})

router.post('/', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)

  try {
    const body = await c.req.json<{
      content: string
      source_type?: string
      source_id?: number
      tags?: string[]
    }>()
    const note = await createNoteAction({
      db,
      userId,
      content: body.content,
      sourceType: body.source_type || 'manual',
      sourceId: body.source_id || null,
      tags: body.tags || [],
    })
    if (!note) {
      return c.json({ error: 'Failed to create note' }, 500)
    }

    return c.json(mapNoteResponse(note))
  } catch (error) {
    console.error('Create note error:', error)
    return c.json({ error: 'Failed to create note' }, 500)
  }
})

router.get('/:id', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)
  const noteId = parseInt(c.req.param('id'))

  try {
    const note = await getNoteRow(db, noteId, userId)

    if (!note) {
      const foreignNote = await getNoteRowById(db, noteId)
      if (foreignNote) {
        return c.json({ error: '无权访问该记录' }, 403)
      }
      return c.json({ error: '记录不存在' }, 404)
    }

    return c.json(mapNoteResponse(note))
  } catch (error) {
    console.error('Get note error:', error)
    return c.json({ error: 'Failed to load note' }, 500)
  }
})

router.put('/:id', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)
  const noteId = parseInt(c.req.param('id'))

  try {
    const body = await c.req.json<{
      content?: string
      tags?: string[]
    }>()
    const note = await updateNoteAction({
      db,
      noteId,
      userId,
      content: body.content,
      tags: body.tags,
    })
    if (!note) {
      const foreignNote = await getNoteRowById(db, noteId)
      if (foreignNote) {
        return c.json({ error: '无权修改该记录' }, 403)
      }
      return c.json({ error: '记录不存在' }, 404)
    }

    return c.json(mapNoteResponse(note))
  } catch (error) {
    console.error('Update note error:', error)
    return c.json({ error: 'Failed to update note' }, 500)
  }
})

router.delete('/:id', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)
  const noteId = parseInt(c.req.param('id'))

  try {
    const existing = await deleteNoteAction({ db, noteId, userId })
    if (!existing) {
      const foreignNote = await getNoteRowById(db, noteId)
      if (foreignNote) {
        return c.json({ error: '无权删除该记录' }, 403)
      }
      return c.json({ error: '记录不存在' }, 404)
    }

    return c.json({ success: true, message: '记录已删除' })
  } catch (error) {
    console.error('Delete note error:', error)
    return c.json({ error: 'Failed to delete note' }, 500)
  }
})

export default router
