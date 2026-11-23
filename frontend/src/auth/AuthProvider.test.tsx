import { act, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { request } from '../api/client';
import { jsonResponse, seedSession } from '../test/helpers';
import { renderAt } from '../test/render';
import { useAuth } from './useAuth';

function Probe() {
  const { user } = useAuth();
  return <div>{user ? `signed in as ${user.fullName}` : 'signed out'}</div>;
}

describe('AuthProvider', () => {
  it('signs out automatically when the token expires', () => {
    vi.useFakeTimers();
    seedSession();
    renderAt(<Probe />);
    expect(screen.getByText('signed in as Test User')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3_600_000 + 1000);
    });
    expect(screen.getByText('signed out')).toBeInTheDocument();
  });

  it('signs out when an authenticated request is rejected with 401', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(401, { message: 'Invalid token' })));
    seedSession();
    renderAt(<Probe />);
    expect(screen.getByText('signed in as Test User')).toBeInTheDocument();

    await act(async () => {
      await request('/api/me').catch(() => undefined);
    });
    expect(screen.getByText('signed out')).toBeInTheDocument();
  });
});