import { describe, expect, it } from 'vitest';
import { makeUser } from '../test/helpers';
import { loadSession, saveSession } from './storage';

describe('session storage', () => {
  it('round-trips a session', () => {
    const session = { token: 'abc', expiresAt: Date.now() + 60_000, user: makeUser('ADMIN') };
    saveSession(session);
    expect(loadSession()).toEqual(session);
  });

  it('drops an expired session and removes it from storage', () => {
    saveSession({ token: 'abc', expiresAt: Date.now() - 1000, user: makeUser() });
    expect(loadSession()).toBeNull();
    expect(localStorage.length).toBe(0);
  });

  it('ignores damaged data', () => {
    localStorage.setItem('preppilot.session', '{not json');
    expect(loadSession()).toBeNull();
  });
});