import type { AnnualReportData, PeriodicReportData, ReportEntryItem } from '../../types/page-data';
import {
  isBoolean,
  isEnumValue,
  isNumber,
  isRecord,
  isString,
  isStringArray,
} from '../apiValidation';

const PERIODIC_REPORT_TYPES = new Set(['weekly', 'monthly']);
const REPORT_TYPES = new Set(['weekly', 'monthly', 'annual']);
const REPORT_TRENDS = new Set(['up', 'down', 'stable']);
const REPORT_GENERATION_SOURCES = new Set(['rules', 'llm']);

export function isPeriodicReportData(value: unknown): value is PeriodicReportData {
  if (!isRecord(value) || !isEnumValue(value.reportType, PERIODIC_REPORT_TYPES)) return false;
  if (value.generationSource !== undefined && !isEnumValue(value.generationSource, REPORT_GENERATION_SOURCES)) return false;
  if (value.llmBlocks !== undefined) {
    if (!isRecord(value.llmBlocks)
      || !isString(value.llmBlocks.version)
      || !isString(value.llmBlocks.provider)
      || !isString(value.llmBlocks.model)
      || !isString(value.llmBlocks.trendExplanation)
      || !isString(value.llmBlocks.periodSummary)
      || !isStringArray(value.llmBlocks.nextActions)
      || !isString(value.llmBlocks.dataNote)
      || !Array.isArray(value.llmBlocks.evidenceRefs)) {
      return false;
    }
  }
  if (!isRecord(value.overview)) return false;
  if (!isString(value.overview.period) || !isNumber(value.overview.viewed) || !isNumber(value.overview.recorded)
    || !isNumber(value.overview.collected) || !isNumber(value.overview.completed) || !isNumber(value.overview.streak)) {
    return false;
  }
  if (!Array.isArray(value.topicTrends)) return false;
  const trendsValid = value.topicTrends.every((trend) => {
    if (!isRecord(trend) || !isString(trend.id) || !isString(trend.icon) || !isString(trend.title)) return false;
    if (!isRecord(trend.heatData)
      || !isNumber(trend.heatData.current)
      || !isNumber(trend.heatData.previous)
      || !isNumber(trend.heatData.change)
      || !isEnumValue(trend.heatData.trend, REPORT_TRENDS)) {
      return false;
    }
    if (!isRecord(trend.hotSpot)
      || !isString(trend.hotSpot.title)
      || !isNumber(trend.hotSpot.discussionCount)
      || !isNumber(trend.hotSpot.userParticipation)
      || !isString(trend.hotSpot.summary)
      || (trend.hotSpot.contentRef !== undefined && !isString(trend.hotSpot.contentRef))) {
      return false;
    }
    return Array.isArray(trend.insights) && trend.insights.every(isString);
  });
  if (!trendsValid) return false;
  if (!isRecord(value.growth) || !isRecord(value.growth.stats) || !isRecord(value.growth.trajectory)) return false;
  if (!isNumber(value.growth.stats.viewed) || !isNumber(value.growth.stats.recorded)
    || !isNumber(value.growth.stats.collected) || !isNumber(value.growth.stats.completed)) {
    return false;
  }
  if (!(value.growth.comparison === null || (isRecord(value.growth.comparison)
    && Array.isArray(value.growth.comparison.current)
    && value.growth.comparison.current.every(isNumber)
    && Array.isArray(value.growth.comparison.previous)
    && value.growth.comparison.previous.every(isNumber)
    && Array.isArray(value.growth.comparison.change)
    && value.growth.comparison.change.every(isNumber)))) {
    return false;
  }
  if (!isString(value.growth.trajectory.title) || !isString(value.growth.trajectory.description) || !isStringArray(value.growth.trajectory.keywords)) {
    return false;
  }
  if (!Array.isArray(value.growth.selectedThoughts) || !value.growth.selectedThoughts.every((thought) => {
    return isRecord(thought) && isNumber(thought.id) && isString(thought.date) && isString(thought.content);
  })) {
    return false;
  }
  return Array.isArray(value.growth.suggestions) && value.growth.suggestions.every(isString);
}

export function isAnnualReportData(value: unknown): value is AnnualReportData {
  if (!isRecord(value) || !isNumber(value.year) || !isRecord(value.stats)) return false;
  if (value.generationSource !== undefined && !isEnumValue(value.generationSource, REPORT_GENERATION_SOURCES)) return false;
  if (value.annualLlmBlocks !== undefined) {
    if (!isRecord(value.annualLlmBlocks)
      || !isString(value.annualLlmBlocks.version)
      || !isString(value.annualLlmBlocks.provider)
      || !isString(value.annualLlmBlocks.model)
      || !isString(value.annualLlmBlocks.thinkingSummary)
      || !isString(value.annualLlmBlocks.actionSummary)
      || !isString(value.annualLlmBlocks.yearEndInsight)
      || !isStringArray(value.annualLlmBlocks.nextYearActions)
      || !isString(value.annualLlmBlocks.dataNote)
      || !Array.isArray(value.annualLlmBlocks.evidenceRefs)) {
      return false;
    }
  }
  return isNumber(value.stats.topicsViewed)
    && isNumber(value.stats.opinionsPosted)
    && isNumber(value.stats.plansCompleted)
    && isNumber(value.stats.daysActive)
    && isStringArray(value.keywords)
    && isStringArray(value.interests)
    && isString(value.thinkingSection)
    && isString(value.actionSection)
    && isString(value.closing);
}

export function isReportEntryItem(value: unknown): value is ReportEntryItem {
  if (!isRecord(value)) return false;
  return isEnumValue(value.reportType, REPORT_TYPES)
    && isString(value.reportTitle)
    && isBoolean(value.available)
    && (value.reportId === undefined || isNumber(value.reportId))
    && (value.generatedAt === undefined || isString(value.generatedAt))
    && (value.periodStart === undefined || value.periodStart === null || isString(value.periodStart))
    && (value.periodEnd === undefined || value.periodEnd === null || isString(value.periodEnd));
}

export function isReportsEnvelope(value: unknown): value is { reports: ReportEntryItem[] } {
  return isRecord(value) && Array.isArray(value.reports) && value.reports.every(isReportEntryItem);
}
