import { beforeEach, describe, expect, it, vi } from 'vitest'

const contentStoreMocks = vi.hoisted(() => ({
  listHotTopics: vi.fn(),
  listOpportunities: vi.fn(),
  getHotTopicById: vi.fn(),
  getOpportunityById: vi.fn(),
  getUserInterests: vi.fn(),
  getHotTopicProcessingResults: vi.fn(),
  getVirtualInterests: vi.fn(),
  containsInterest: vi.fn(),
  matchInterestScore: vi.fn(),
  buildTopicRankingScore: vi.fn(),
  buildOpportunityRankingScore: vi.fn(),
  buildWorthKnowingRankingScore: vi.fn(),
  buildWorthActingRankingScore: vi.fn(),
  rankInterestMatches: vi.fn(),
}))

vi.mock('../src/services/content', async () => {
  const actual = await vi.importActual<typeof import('../src/services/content')>('../src/services/content')
  return {
    ...actual,
    listHotTopics: contentStoreMocks.listHotTopics,
    listOpportunities: contentStoreMocks.listOpportunities,
    getHotTopicById: contentStoreMocks.getHotTopicById,
    getOpportunityById: contentStoreMocks.getOpportunityById,
    getUserInterests: contentStoreMocks.getUserInterests,
    getHotTopicProcessingResults: contentStoreMocks.getHotTopicProcessingResults,
    getVirtualInterests: contentStoreMocks.getVirtualInterests,
    containsInterest: contentStoreMocks.containsInterest,
    matchInterestScore: contentStoreMocks.matchInterestScore,
    buildTopicRankingScore: contentStoreMocks.buildTopicRankingScore,
    buildOpportunityRankingScore: contentStoreMocks.buildOpportunityRankingScore,
    buildWorthKnowingRankingScore: contentStoreMocks.buildWorthKnowingRankingScore,
    buildWorthActingRankingScore: contentStoreMocks.buildWorthActingRankingScore,
    rankInterestMatches: contentStoreMocks.rankInterestMatches,
  }
})

import app from '../src/index'

function mockEnv() {
  return {
    DB: {} as D1Database,
    ENVIRONMENT: 'test',
  }
}

describe('workers index route aliases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    contentStoreMocks.listHotTopics.mockResolvedValue([])
    contentStoreMocks.listOpportunities.mockResolvedValue([])
  })

  it('keeps hot-topics legacy alias pointing at the content handler', async () => {
    contentStoreMocks.listHotTopics.mockResolvedValue([{ id: 1, title: 'AI 热点' }])

    const response = await app.request('/api/v1/hot-topics?limit=1', {}, mockEnv())
    expect(response.status).toBe(200)

    const payload = await response.json()
    expect(payload.total).toBe(1)
    expect(payload.data[0].title).toBe('AI 热点')
    expect(contentStoreMocks.listHotTopics).toHaveBeenCalledWith(expect.anything(), 1)
  })
})
