import type { ApiEnvelope, ApiError } from './types';

const DEFAULT_BASE_URL = 'http://localhost/api';
const TOKEN_KEY = 'dam.auth.token';

function getBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
}

function generateCorrelationId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.removeItem(TOKEN_KEY);
}

function buildApiError(input: {
  code: string;
  message: string;
  status: number;
  details?: unknown[];
  correlationId?: string | null;
}): ApiError {
  return {
    code: input.code,
    message: input.message,
    status: input.status,
    details: input.details || [],
    correlationId: input.correlationId || null,
  };
}

async function request<T>(path: string, options: RequestInit = {}, auth = false): Promise<T> {
  const correlationId = generateCorrelationId();
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('x-correlation-id', correlationId);

  if (auth) {
    const token = getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const res = await fetch(`${getBaseUrl()}${path}`, {
    ...options,
    headers,
    cache: 'no-store',
  });

  let envelope: ApiEnvelope<T> | null = null;
  try {
    envelope = (await res.json()) as ApiEnvelope<T>;
  } catch {
    throw buildApiError({
      code: 'INVALID_JSON',
      message: 'Invalid response from server',
      status: res.status,
      details: [],
      correlationId: res.headers.get('x-correlation-id'),
    });
  }

  if (!res.ok || !envelope.success) {
    const message = envelope.success ? 'Request failed' : envelope.error.message;
    const code = envelope.success ? 'HTTP_ERROR' : envelope.error.code;
    const details = envelope.success ? [] : envelope.error.details;
    const corr = envelope.correlationId || res.headers.get('x-correlation-id');

    throw buildApiError({
      code,
      message,
      status: res.status,
      details,
      correlationId: corr,
    });
  }

  return envelope.data;
}

async function requestWithMeta<T>(
  path: string,
  options: RequestInit = {},
  auth = false,
): Promise<{ data: T; meta?: Record<string, unknown> }> {
  const correlationId = generateCorrelationId();
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('x-correlation-id', correlationId);

  if (auth) {
    const token = getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const res = await fetch(`${getBaseUrl()}${path}`, {
    ...options,
    headers,
    cache: 'no-store',
  });

  let envelope: ApiEnvelope<T> | null = null;
  try {
    envelope = (await res.json()) as ApiEnvelope<T>;
  } catch {
    throw buildApiError({
      code: 'INVALID_JSON',
      message: 'Invalid response from server',
      status: res.status,
      details: [],
      correlationId: res.headers.get('x-correlation-id'),
    });
  }

  if (!res.ok || !envelope.success) {
    const message = envelope.success ? 'Request failed' : envelope.error.message;
    const code = envelope.success ? 'HTTP_ERROR' : envelope.error.code;
    const details = envelope.success ? [] : envelope.error.details;
    const corr = envelope.correlationId || res.headers.get('x-correlation-id');

    throw buildApiError({
      code,
      message,
      status: res.status,
      details,
      correlationId: corr,
    });
  }

  return {
    data: envelope.data,
    meta: envelope.meta,
  };
}

export const http = {
  get<T>(path: string, auth = false): Promise<T> {
    return request<T>(path, { method: 'GET' }, auth);
  },
  post<T>(path: string, body: unknown, auth = false): Promise<T> {
    return request<T>(path, { method: 'POST', body: JSON.stringify(body) }, auth);
  },
  put<T>(path: string, body: unknown, auth = false): Promise<T> {
    return request<T>(path, { method: 'PUT', body: JSON.stringify(body) }, auth);
  },
  delete<T>(path: string, auth = false): Promise<T> {
    return request<T>(path, { method: 'DELETE' }, auth);
  },
  getWithMeta<T>(path: string, auth = false): Promise<{ data: T; meta?: Record<string, unknown> }> {
    return requestWithMeta<T>(path, { method: 'GET' }, auth);
  },
};

export function isApiError(e: unknown): e is ApiError {
  return typeof e === 'object' && e !== null && 'code' in e && 'message' in e && 'status' in e;
}
