import {
  isAnnualReportData,
  isPeriodicReportData,
  isReportsEnvelope,
} from '../apiGuards';
import { validateApiResponse } from '../apiValidation';
import { withQuery } from '../apiUrl';
import type { ApiRequest } from './types';

export async function getReports(request: ApiRequest) {
  const endpoint = '/reports';
  const response = await request<unknown>(endpoint);
  return validateApiResponse(endpoint, response, isReportsEnvelope);
}

export async function getWeeklyReport(
  request: ApiRequest,
  reportId?: number,
  options: { refresh?: boolean } = {},
) {
  const endpoint = withQuery('/reports/weekly', {
    report_id: reportId,
    refresh: options.refresh ? '1' : undefined,
  });
  const response = await request<unknown>(endpoint);
  return validateApiResponse(endpoint, response, isPeriodicReportData);
}

export async function getMonthlyReport(
  request: ApiRequest,
  reportId?: number,
  options: { refresh?: boolean } = {},
) {
  const endpoint = withQuery('/reports/monthly', {
    report_id: reportId,
    refresh: options.refresh ? '1' : undefined,
  });
  const response = await request<unknown>(endpoint);
  return validateApiResponse(endpoint, response, isPeriodicReportData);
}

export async function getAnnualReport(
  request: ApiRequest,
  reportId?: number,
  options: { refresh?: boolean } = {},
) {
  const endpoint = withQuery('/reports/annual', {
    report_id: reportId,
    refresh: options.refresh ? '1' : undefined,
  });
  const response = await request<unknown>(endpoint);
  return validateApiResponse(endpoint, response, isAnnualReportData);
}
