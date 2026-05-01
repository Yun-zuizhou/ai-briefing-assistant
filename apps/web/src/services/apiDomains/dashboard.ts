import { isTodayPageData } from '../apiGuards';
import { validateApiResponse } from '../apiValidation';
import type { ApiRequest } from './types';

export async function getTodayPageData(request: ApiRequest) {
  const endpoint = '/dashboard/today';
  const response = await request<unknown>(endpoint);
  return validateApiResponse(endpoint, response, isTodayPageData);
}
