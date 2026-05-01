// Public Dashboard service API for routes and schedulers.
// Keep this file explicit: dashboard internals own content selection, payload
// normalization, persistence, and generation details.
export { loadTodayPageData } from './today-page'
export { runTodayBriefingCron } from './today-briefing-generation'
export type { LoadTodayPageDataParams } from './today-page'
export type {
  TodayBriefingCronResult,
  TodayBriefingEnv,
  TodayBriefingGenerationResult,
} from './today-briefing-generation'
