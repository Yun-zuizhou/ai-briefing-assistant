import { Hono } from 'hono'
import {
  createFavoriteAction,
  deleteFavoriteAction,
  getFavoriteRowById,
  listFavoriteRows,
  mapFavoriteResponse,
  parseFavoriteContentRef,
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
  const itemType = c.req.query('item_type')

  try {
    const items = await listFavoriteRows(db, userId, itemType)

    return c.json({
      total: items.length,
      items: items.map(mapFavoriteResponse),
    })
  } catch (error) {
    console.error('Get favorites error:', error)
    return c.json({ error: 'Failed to load favorites' }, 500)
  }
})

router.post('/', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)

  try {
    const body = await c.req.json<{
      item_type?: string
      item_id?: number
      content_ref?: string
      item_title: string
      item_summary?: string
      item_source?: string
      item_url?: string
    }>()

    let itemType = body.item_type
    let itemId = body.item_id

    if (body.content_ref) {
      const [type, id] = parseFavoriteContentRef(body.content_ref)
      itemType = type
      itemId = id
    }

    if (!itemType || itemId === undefined) {
      return c.json({ error: 'item_type/item_id 或 content_ref 至少需要提供一种' }, 400)
    }

    const favorite = await createFavoriteAction({
      db,
      userId,
      itemType,
      itemId,
      itemTitle: body.item_title,
      itemSummary: body.item_summary || null,
      itemSource: body.item_source || null,
      itemUrl: body.item_url || null,
    })
    if (!favorite) {
      return c.json({ error: 'Failed to create favorite' }, 500)
    }

    return c.json(mapFavoriteResponse(favorite))
  } catch (error) {
    console.error('Create favorite error:', error)
    return c.json({ error: 'Failed to create favorite' }, 500)
  }
})

router.delete('/:id', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)
  const favoriteId = parseInt(c.req.param('id'))

  try {
    const existing = await deleteFavoriteAction({ db, favoriteId, userId })
    if (!existing) {
      const foreignFavorite = await getFavoriteRowById(db, favoriteId)
      if (foreignFavorite) {
        return c.json({ error: '无权删除该收藏' }, 403)
      }
      return c.json({ error: '收藏不存在' }, 404)
    }

    return c.json({ success: true, message: '收藏已删除' })
  } catch (error) {
    console.error('Delete favorite error:', error)
    return c.json({ error: 'Failed to delete favorite' }, 500)
  }
})

export default router
