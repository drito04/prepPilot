import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import type { Role } from './api/types';
import { jsonResponse, seedSession } from './test/helpers';
import { renderAt } from './test/render';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(
    jsonResponse(200, {
      branch: null,
      graduationYear: null,
      cgpa: null,
      targetCompanyType: null,
      updatedAt: null,
    }),
  );
  vi.stubGlobal('fetch', fetchMock);
});

describe('App routes', () => {
  it.each<[Role, string]>([
    ['STUDENT', '/student'],
    ['STUDENT', '/student/profile'],
    ['INTERVIEWER', '/interviewer'],
    ['ADMIN', '/admin'],
  ])('shows the header and log out button for %s on %s', async (role, path) => {
    seedSession(role);
    renderAt(<App />, path);
    expect(await screen.findByRole('button', { name: 'Log out' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
  });

  it('does not show the header on the login page', () => {
    renderAt(<App />, '/login');
    expect(screen.queryByRole('button', { name: 'Log out' })).not.toBeInTheDocument();
  });
});