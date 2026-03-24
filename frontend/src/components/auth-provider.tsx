'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { login as loginApi, register as registerApi, verify } from '@/lib/api/auth-api';
import { clearStoredToken, getStoredToken, setStoredToken } from '@/lib/auth-storage';
import { ApiError } from '@/types/api';
import { AuthSession } from '@/types/auth';

type AuthContextValue = {
  session: AuthSession | null;
  isReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function buildSession(token: string): Promise<AuthSession> {
  const user = await verify(token);
  return {
    token,
    tokenType: 'Bearer',
    user,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isReady, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    const token = getStoredToken();
    if (!token) {
      setReady(true);
      return;
    }

    buildSession(token)
      .then((next) => {
        if (!mounted) {
          return;
        }
        setSession(next);
      })
      .catch(() => {
        if (!mounted) {
          return;
        }
        clearStoredToken();
        setSession(null);
      })
      .finally(() => {
        if (mounted) {
          setReady(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isReady,
      async login(email, password) {
        const response = await loginApi({ email, password });
        setStoredToken(response.token);
        const next = await buildSession(response.token);
        setSession(next);
      },
      async register(email, password) {
        const response = await registerApi({ email, password });
        setStoredToken(response.token);
        const next = await buildSession(response.token);
        setSession(next);
      },
      logout() {
        clearStoredToken();
        setSession(null);
      },
    }),
    [session, isReady],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new ApiError({
      code: 'AUTH_CONTEXT_MISSING',
      message: 'AuthProvider is missing',
      status: 500,
    });
  }

  return value;
}
