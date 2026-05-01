import type { ApiResponse } from '../apiClient';

export type ApiRequest = <T>(
  endpoint: string,
  options?: RequestInit & { suppressErrorLog?: boolean },
) => Promise<ApiResponse<T>>;

export interface ApiDomainRuntime {
  readonly baseUrl: string;
  readonly request: ApiRequest;
}
