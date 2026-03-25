import assert from 'node:assert/strict';
import test from 'node:test';
import { clearToken, getToken, http, isApiError, setToken } from '../lib/http';

function createSessionStorage() {
  const store = new Map<string, string>();

  return {
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    removeItem(key: string) {
      store.delete(key);
    },
  };
}

test('token helpers are safe on server side when window is unavailable', () => {
  const g = globalThis as any;
  const originalWindow = g.window;
  g.window = undefined;

  try {
    assert.equal(getToken(), null);
    setToken('abc');
    clearToken();
    assert.equal(getToken(), null);
  } finally {
    g.window = originalWindow;
  }
});

test('http.get sends auth + correlation headers and returns payload', async () => {
  const g = globalThis as any;
  const originalWindow = g.window;
  const originalFetch = g.fetch;

  g.window = { sessionStorage: createSessionStorage() };
  setToken('jwt-token-1');

  let capturedHeaders: Headers | null = null;
  g.fetch = async (_url: string, options: RequestInit) => {
    capturedHeaders = options.headers as Headers;
    return {
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => ({
        success: true,
        data: { id: 'ok-1' },
      }),
    } as Response;
  };

  try {
    const result = await http.get<{ id: string }>('/auth/verify', true);
    assert.equal(result.id, 'ok-1');
    assert.equal(capturedHeaders?.get('Authorization'), 'Bearer jwt-token-1');
    assert.ok(capturedHeaders?.get('x-correlation-id'));
    assert.equal(capturedHeaders?.get('Content-Type'), 'application/json');
  } finally {
    g.fetch = originalFetch;
    g.window = originalWindow;
  }
});

test('http.get throws INVALID_JSON error when response is malformed', async () => {
  const g = globalThis as any;
  const originalFetch = g.fetch;

  g.fetch = async () => {
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'x-correlation-id': 'corr-invalid-json' }),
      json: async () => {
        throw new Error('bad-json');
      },
    } as Response;
  };

  try {
    await assert.rejects(
      async () => {
        await http.get('/catalog/artworks');
      },
      (error: unknown) => {
        assert.ok(isApiError(error));
        assert.equal((error as { code: string }).code, 'INVALID_JSON');
        assert.equal((error as { correlationId: string | null }).correlationId, 'corr-invalid-json');
        return true;
      },
    );
  } finally {
    g.fetch = originalFetch;
  }
});

test('http.getWithMeta returns data and meta fields', async () => {
  const g = globalThis as any;
  const originalFetch = g.fetch;

  g.fetch = async () => {
    return {
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => ({
        success: true,
        data: [{ id: 'artwork-1' }],
        meta: { page: 2, limit: 10, total: 25, totalPages: 3 },
      }),
    } as Response;
  };

  try {
    const result = await http.getWithMeta<Array<{ id: string }>>('/catalog/artworks');
    assert.equal(result.data.length, 1);
    assert.deepEqual(result.meta, { page: 2, limit: 10, total: 25, totalPages: 3 });
  } finally {
    g.fetch = originalFetch;
  }
});
