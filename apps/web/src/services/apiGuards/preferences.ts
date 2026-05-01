import type { GrowthOverviewData } from '../../types/page-data';
import {
  isEnumValue,
  isNumber,
  isOptionalNumber,
  isRecord,
  isString,
} from '../apiValidation';
import { isReportEntryItem } from './reports';

const GROWTH_KEYWORD_TRENDS = new Set(['up', 'down', 'stable']);
const HISTORY_TYPES = new Set(['briefing', 'journal', 'action']);

function isGrowthKeywordItem(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isString(value.keyword)
    && isOptionalNumber(value.weight)
    && (value.trend === undefined || value.trend === null || isEnumValue(value.trend, GROWTH_KEYWORD_TRENDS));
}

function isWeeklyGrowthSummary(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isString(value.weekLabel)
    && isString(value.growthSummary)
    && (value.activeInterestChanges === undefined || isString(value.activeInterestChanges))
    && (value.completedActions === undefined || isNumber(value.completedActions))
    && (value.newNotesCount === undefined || isNumber(value.newNotesCount));
}

function isPersonaSnapshot(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isString(value.personaSummary)
    && (value.personaVersion === undefined || isString(value.personaVersion))
    && (value.updatedAt === undefined || isString(value.updatedAt));
}

function isHistoryPreviewItem(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isEnumValue(value.historyType, HISTORY_TYPES)
    && isString(value.historyTitle)
    && isString(value.historyDate);
}

export function isGrowthOverviewData(value: unknown): value is GrowthOverviewData {
  if (!isRecord(value)) return false;
  return isString(value.userName)
    && (value.streakDays === undefined || isNumber(value.streakDays))
    && (value.totalThoughts === undefined || isNumber(value.totalThoughts))
    && isWeeklyGrowthSummary(value.weeklySummary)
    && Array.isArray(value.keywords)
    && value.keywords.every(isGrowthKeywordItem)
    && isPersonaSnapshot(value.persona)
    && Array.isArray(value.recentHistoryItems)
    && value.recentHistoryItems.every(isHistoryPreviewItem)
    && Array.isArray(value.reports)
    && value.reports.every(isReportEntryItem);
}
