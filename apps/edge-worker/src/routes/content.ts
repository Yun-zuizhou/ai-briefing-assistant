import { Hono, type Context } from 'hono'
import {
  buildArticleDetail,
  buildHotTopicDetail,
  consultDigestResult,
  DigestConsultProviderError,
  buildOpportunityDetail,
  getDailyDigestResultByRef,
  getArticleById,
  getHotTopicById,
  getOpportunityById,
  listHotTopics,
  listOpportunities,
  listDailyDigestResults,
  listRelatedItemsForArticle,
  listRelatedItemsForHotTopic,
  listRelatedItemsForOpportunity,
  mapDailyDigestItem,
  mapRelatedItems,
} from '../services/content'
import { getUserSettings } from '../services/behavior'
import { resolveUserId } from '../utils/request-user'

type Bindings = {
  DB: D1Database
  ENVIRONMENT: string
  SUMMARY_PROVIDER_ENABLED?: string
  SUMMARY_PROVIDER_API_URL?: string
  SUMMARY_PROVIDER_API_KEY?: string
  SUMMARY_PROVIDER_MODEL?: string
  SUMMARY_PROVIDER_DEBUG_FALLBACK?: string
}

const router = new Hono<{ Bindings: Bindings }>()

export async function getHotTopicsHandler(c: Context<{ Bindings: Bindings }>) {
  const db = c.env.DB
  const limit = parseInt(c.req.query('limit') || '20')
  
  try {
    const topics = await listHotTopics(db, limit)
    return c.json({ data: topics, total: topics.length })
  } catch (error) {
    console.error('Hot topics error:', error)
    return c.json({ error: 'Failed to load hot topics' }, 500)
  }
}

export async function getOpportunitiesHandler(c: Context<{ Bindings: Bindings }>) {
  const db = c.env.DB
  const limit = parseInt(c.req.query('limit') || '20')
  
  try {
    const opportunities = await listOpportunities(db, limit)
    return c.json({ data: opportunities, total: opportunities.length })
  } catch (error) {
    console.error('Opportunities error:', error)
    return c.json({ error: 'Failed to load opportunities' }, 500)
  }
}

router.get('/hot-topics', getHotTopicsHandler)
router.get('/opportunities', getOpportunitiesHandler)

router.get('/daily-digest', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)
  const requestedProfileId = c.req.query('profile_id')
  const profileId = requestedProfileId ? String(requestedProfileId).trim() : ''
  const limit = Number.parseInt(c.req.query('limit') || '8', 10)

  try {
    const rows = await listDailyDigestResults(db, userId, profileId || null, Number.isNaN(limit) ? 8 : limit)
    return c.json({
      profileId: profileId || 'all',
      mode: profileId ? 'filtered' : 'all-matched-results',
      total: rows.length,
      items: rows.map(mapDailyDigestItem),
    })
  } catch (error) {
    console.error('Daily digest error:', error)
    return c.json({ error: 'Failed to load daily digest' }, 500)
  }
})

router.get('/by-ref', async (c) => {
  const db = c.env.DB
  const contentRef = c.req.query('content_ref')
  
  if (!contentRef) {
    return c.json({ error: 'content_ref is required' }, 400)
  }
  
  try {
    const [type, idStr] = contentRef.split(':')
    const id = parseInt(idStr)
    
    if (type === 'hot_topic') {
      const topic = await getHotTopicById(db, id)
      
      if (!topic) {
        return c.json({ error: 'Hot topic not found' }, 404)
      }
      
      const relatedItems = mapRelatedItems(await listRelatedItemsForHotTopic(db, topic))
      return c.json(buildHotTopicDetail({ contentRef, topic, relatedItems }))
    }
    
    if (type === 'opportunity') {
      const opp = await getOpportunityById(db, id)
      
      if (!opp) {
        return c.json({ error: 'Opportunity not found' }, 404)
      }
      
      const relatedItems = mapRelatedItems(await listRelatedItemsForOpportunity(db, opp))
      return c.json(buildOpportunityDetail({ contentRef, opportunity: opp, relatedItems }))
    }

    if (type === 'article') {
      const article = await getArticleById(db, id)
      if (!article) {
        return c.json({ error: 'Article not found' }, 404)
      }
      const relatedItems = mapRelatedItems(await listRelatedItemsForArticle(db, article))
      return c.json(buildArticleDetail({ contentRef, article, relatedItems }))
    }
    
    return c.json({ error: 'Unsupported content type' }, 400)
  } catch (error) {
    console.error('Content by-ref error:', error)
    return c.json({ error: 'Failed to load content' }, 500)
  }
})

router.post('/consult', async (c) => {
  const db = c.env.DB
  const userId = await resolveUserId(c)

  try {
    const body = await c.req.json<{
      result_ref?: string
      question?: string
    }>()
    const resultRef = String(body.result_ref || '').trim()
    const question = String(body.question || '').trim()

    if (!resultRef) {
      return c.json({ error: 'result_ref is required' }, 400)
    }
    if (!question) {
      return c.json({ error: 'question is required' }, 400)
    }

    const digestResult = await getDailyDigestResultByRef(db, resultRef, userId)
    if (!digestResult) {
      const foreignResult = await getDailyDigestResultByRef(db, resultRef)
      if (foreignResult) {
        return c.json({ error: '无权访问该摘要结果' }, 403)
      }
      return c.json({ error: 'Summary result not found' }, 404)
    }

    const userSettings = await getUserSettings(db, userId)
    const consultResult = await consultDigestResult({
      bindings: c.env,
      digestResult,
      question,
      userProvider: {
        provider: userSettings?.ai_provider,
        apiKey: userSettings?.ai_api_key,
      },
    })

    return c.json({
      resultRef,
      question,
      answer: consultResult.answer,
      evidence: consultResult.evidence,
      uncertainties: consultResult.uncertainties,
      suggestedNextActions: consultResult.suggested_next_actions,
      providerName: consultResult.providerName,
      modelName: consultResult.modelName,
    })
  } catch (error) {
    if (error instanceof DigestConsultProviderError) {
      const status = error.code === 'provider_not_configured' ? 503 : 502
      return c.json({ error: error.message }, status)
    }
    console.error('Digest consult error:', error)
    return c.json({ error: 'Failed to consult digest result' }, 500)
  }
})

export default router
