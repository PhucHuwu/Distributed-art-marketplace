const authTokenKey = 'dam.auth.token';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.sessionStorage.getItem(authTokenKey);
}

export function setStoredToken(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.sessionStorage.setItem(authTokenKey, token);
}

export function clearStoredToken(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.sessionStorage.removeItem(authTokenKey);
}
