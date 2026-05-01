// Public Content service API for routes and cross-domain flows.
// Keep this file explicit: content owns source reads, detail shaping, ranking,
// and digest consultation; route code should not import content internals directly.
export {
  replaceUserInterests,
} from './actions'
export {
  buildArticleDetail,
  buildHotTopicDetail,
  buildOpportunityDetail,
  mapDailyDigestItem,
  mapRelatedItems,
} from './builder'
export {
  buildConsultMessages,
  consultDigestResult,
  DigestConsultProviderError,
  parseConsultPayload,
} from './consult'
export {
  buildOpportunityRankingScore,
  buildTopicRankingScore,
  buildWorthActingRankingScore,
  buildWorthKnowingRankingScore,
  containsInterest,
  getArticleById,
  getDailyDigestResultByRef,
  getHotTopicById,
  getHotTopicProcessingResults,
  getOpportunityById,
  getUserInterests,
  getVirtualInterests,
  listDailyDigestResults,
  listArticlesBySourceUrls,
  listHotTopics,
  listOpportunities,
  listRelatedItemsForArticle,
  listRelatedItemsForHotTopic,
  listRelatedItemsForOpportunity,
  matchInterestScore,
  rankInterestMatches,
} from './store'
export type {
  HotTopic,
  HotTopicProcessingResult,
  Opportunity,
  RankedMatch,
  UserInterest,
} from './store'
export type {
  ArticleRow,
  DailyDigestRow,
  RelatedItemRow,
} from './types'
