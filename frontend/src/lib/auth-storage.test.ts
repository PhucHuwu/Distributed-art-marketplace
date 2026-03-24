import { beforeEach, describe, expect, it } from 'vitest';
import { clearStoredToken, getStoredToken, setStoredToken } from './auth-storage';

describe('auth storage', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('stores and clears token', () => {
    expect(getStoredToken()).toBeNull();
    setStoredToken('abc');
    expect(getStoredToken()).toBe('abc');
    clearStoredToken();
    expect(getStoredToken()).toBeNull();
  });
});
