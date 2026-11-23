import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { setUnauthorizedHandler } from '../api/client';
import type { LoginResponse } from '../api/types';
import { AuthContext } from './AuthContext';
import { clearSession, loadSession, saveSession, type Session } from './storage';

const MAX_TIMER_MS = 2 ** 31 - 1;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => loadSession());

  const signOut = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  const signIn = useCallback((response: LoginResponse) => {
    const next: Session = {
      token: response.accessToken,
      expiresAt: Date.now() + response.expiresIn * 1000,
      user: response.user,
    };
    saveSession(next);
    setSession(next);
  }, []);

  // An authenticated call that comes back 401 means the token was rejected.
  useEffect(() => {
    setUnauthorizedHandler(signOut);
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  // No refresh tokens in v1, so sign out the moment the token expires.
  const expiresAt = session?.expiresAt;
  useEffect(() => {
    if (expiresAt === undefined) {
      return;
    }
    const delay = Math.min(Math.max(expiresAt - Date.now(), 0), MAX_TIMER_MS);
    const timer = window.setTimeout(signOut, delay);
    return () => window.clearTimeout(timer);
  }, [expiresAt, signOut]);

  const value = useMemo(
    () => ({ user: session?.user ?? null, signIn, signOut }),
    [session, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}