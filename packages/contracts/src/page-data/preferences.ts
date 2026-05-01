import type { ReportEntryItem } from './reports'

export interface GrowthKeywordItem {
  keyword: string
  weight?: number
  trend?: 'up' | 'down' | 'stable'
}

export interface PersonaSnapshot {
  personaSummary: string
  personaVersion?: string
  updatedAt?: string
}

export interface WeeklyGrowthSummary {
  weekLabel: string
  activeInterestChanges?: string
  completedActions?: number
  newNotesCount?: number
  growthSummary: string
}

export interface HistoryPreviewItem {
  historyType: 'briefing' | 'journal' | 'action'
  historyTitle: string
  historyDate: string
}

export interface GrowthOverviewData {
  userName: string
  streakDays?: number
  totalThoughts?: number
  weeklySummary: WeeklyGrowthSummary
  keywords: GrowthKeywordItem[]
  persona: PersonaSnapshot
  recentHistoryItems: HistoryPreviewItem[]
  reports: ReportEntryItem[]
}
