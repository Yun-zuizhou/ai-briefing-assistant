export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export class ApiClient {
  protected readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async parseResponseBody<T>(response: Response, endpoint: string): Promise<T | undefined> {
    if (response.status === 204) {
      return undefined;
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        return (await response.json()) as T;
      } catch {
        throw new Error(`Invalid JSON response - ${endpoint}`);
      }
    }

    try {
      const text = await response.text();
      return (text as unknown) as T;
    } catch {
      throw new Error(`Invalid text response - ${endpoint}`);
    }
  }

  private extractErrorMessage(payload: unknown): string | null {
    if (!payload) {
      return null;
    }
    if (typeof payload === 'string') {
      const trimmed = payload.trim();
      return trimmed.length > 0 ? trimmed : null;
    }
    if (typeof payload === 'object' && 'error' in payload) {
      const raw = (payload as { error?: unknown }).error;
      if (typeof raw === 'string' && raw.trim().length > 0) {
        return raw.trim();
      }
    }
    return null;
  }

  protected async request<T>(
    endpoint: string,
    options: RequestInit & { suppressErrorLog?: boolean } = {},
  ): Promise<ApiResponse<T>> {
    const { suppressErrorLog, ...fetchOptions } = options;
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...fetchOptions,
        credentials: fetchOptions.credentials ?? 'include',
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
      });

      const payload = await this.parseResponseBody<unknown>(response, endpoint);
      if (!response.ok) {
        const serverMessage = this.extractErrorMessage(payload);
        throw new Error(serverMessage || `HTTP error! status: ${response.status} - ${endpoint}`);
      }
      return { data: payload as T };
    } catch (error) {
      if (!suppressErrorLog) {
        console.error('API request error:', error);
      }
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}
