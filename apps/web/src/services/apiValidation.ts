import type { ApiResponse } from './apiClient';

export type UnknownRecord = Record<string, unknown>;

export function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

export function isStringOrNumber(value: unknown): value is string | number {
  return isString(value) || isNumber(value);
}

export function isOptionalString(value: unknown) {
  return value === undefined || value === null || isString(value);
}

export function isOptionalNumber(value: unknown) {
  return value === undefined || value === null || isNumber(value);
}

export function isOptionalStringArray(value: unknown) {
  return value === undefined || value === null || isStringArray(value);
}

export function isEnumValue<T extends string>(value: unknown, options: Set<T>): value is T {
  return isString(value) && options.has(value as T);
}

export function validateApiResponse<T>(
  endpoint: string,
  response: ApiResponse<unknown>,
  guard: (value: unknown) => value is T,
): ApiResponse<T> {
  if (response.error) {
    return { error: response.error };
  }
  if (response.data === undefined) {
    return { error: `Empty API response - ${endpoint}` };
  }
  if (!guard(response.data)) {
    return { error: `Invalid API response shape - ${endpoint}` };
  }
  return { data: response.data };
}
