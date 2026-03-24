import { getApiBaseUrl } from './env';
import { createCorrelationId } from './correlation-id';
import { ApiError, ApiResponse } from '@/types/api';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
};

function normalizeGatewayPath(path: string): string {
  const routes: Array<{ prefix: string; gatewayPrefix: string }> = [
    { prefix: '/auth/', gatewayPrefix: '/auth' },
    { prefix: '/users/', gatewayPrefix: '/users' },
    { prefix: '/catalog/', gatewayPrefix: '/catalog' },
    { prefix: '/inventory/', gatewayPrefix: '/inventory' },
    { prefix: '/orders/', gatewayPrefix: '/orders' },
    { prefix: '/payments/', gatewayPrefix: '/payments' },
  ];

  for (const route of routes) {
    if (path.startsWith(route.prefix)) {
      return `${route.gatewayPrefix}${path}`;
    }
  }

  return path;
}

async function parseResponse<T>(res: Response): Promise<T> {
  const payload = (await res.json()) as ApiResponse<T>;

  if (!res.ok || !payload.success) {
    const message = payload.success ? 'Request failed' : payload.error.message;
    const code = payload.success ? 'HTTP_ERROR' : payload.error.code;
    const details = payload.success ? [] : payload.error.details;
    const correlationId = payload.correlationId || res.headers.get('x-correlation-id');
    throw new ApiError({
      code,
      message,
      details,
      status: res.status,
      correlationId,
    });
  }

  return payload.data;
}

async function parseEnvelope<T>(res: Response): Promise<{ data: T; meta?: Record<string, unknown> }> {
  const payload = (await res.json()) as ApiResponse<T>;

  if (!res.ok || !payload.success) {
    const message = payload.success ? 'Request failed' : payload.error.message;
    const code = payload.success ? 'HTTP_ERROR' : payload.error.code;
    const details = payload.success ? [] : payload.error.details;
    const correlationId = payload.correlationId || res.headers.get('x-correlation-id');
    throw new ApiError({
      code,
      message,
      details,
      status: res.status,
      correlationId,
    });
  }

  return {
    data: payload.data,
    meta: payload.meta,
  };
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const normalizedPath = normalizeGatewayPath(path);
  const headers = new Headers({
    'Content-Type': 'application/json',
    'x-correlation-id': createCorrelationId(),
  });

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  const res = await fetch(`${baseUrl}${normalizedPath}`, {
    method: options.method || 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
    cache: 'no-store',
  });

  return parseResponse<T>(res);
}

export async function requestWithMeta<T>(path: string, options: RequestOptions = {}) {
  const baseUrl = getApiBaseUrl();
  const normalizedPath = normalizeGatewayPath(path);
  const headers = new Headers({
    'Content-Type': 'application/json',
    'x-correlation-id': createCorrelationId(),
  });

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  const res = await fetch(`${baseUrl}${normalizedPath}`, {
    method: options.method || 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
    cache: 'no-store',
  });

  return parseEnvelope<T>(res);
}
