import { is__Feature__PageData } from '../apiGuards';
import { validateApiResponse } from '../apiValidation';
import type { ApiRequest } from './types';

export async function get__Feature__PageData(request: ApiRequest) {
  const endpoint = '/__domain__/__feature__';
  const response = await request<unknown>(endpoint);
  return validateApiResponse(endpoint, response, is__Feature__PageData);
}
