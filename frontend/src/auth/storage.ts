import type { User } from '../api/types';

const KEY = 'preppilot.session';

export interface Session {
  token: string;
  expiresAt: number; // epoch milliseconds
  user: User;
}

export function saveSession(session: Session): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    /* storage unavailable (private mode or quota): the session just won't survive a refresh */
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
}

/** Returns the stored session, or null if there is none, it is damaged, or it has expired. */
export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      return null;
    }
    const session = JSON.parse(raw) as Partial<Session>;
    const valid =
      typeof session.token === 'string' &&
      typeof session.expiresAt === 'number' &&
      typeof session.user === 'object' &&
      session.user !== null;
    if (!valid || (session.expiresAt as number) <= Date.now()) {
      clearSession();
      return null;
    }
    return session as Session;
  } catch {
    clearSession();
    return null;
  }
}