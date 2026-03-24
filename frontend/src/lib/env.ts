const fallbackApiBaseUrl = 'http://localhost/api';

export function getApiBaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_API_BASE_URL || fallbackApiBaseUrl;
  return value.replace(/\/$/, '');
}
