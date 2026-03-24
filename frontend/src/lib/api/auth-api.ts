import { request } from '@/lib/http-client';
import { AuthTokenResponse, VerifyResponse } from '@/types/auth';

export async function login(payload: { email: string; password: string }) {
  return request<AuthTokenResponse>('/auth/login', {
    method: 'POST',
    body: payload,
  });
}

export async function register(payload: { email: string; password: string }) {
  return request<AuthTokenResponse>('/auth/register', {
    method: 'POST',
    body: payload,
  });
}

export async function verify(token: string) {
  return request<VerifyResponse>('/auth/verify', {
    token,
  });
}
