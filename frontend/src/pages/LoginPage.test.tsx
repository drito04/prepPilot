import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Role } from '../api/types';
import { jsonResponse, makeLoginResponse } from '../test/helpers';
import { renderAt } from '../test/render';
import { LoginPage } from './LoginPage';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

const tree = (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/student" element={<div>student home</div>} />
    <Route path="/admin" element={<div>admin home</div>} />
  </Routes>
);

async function submitLogin(email = 'a@test.com', password = 'Passw0rd!x') {
  const user = userEvent.setup();
  renderAt(tree, '/login');
  await user.type(screen.getByLabelText('Email'), email);
  await user.type(screen.getByLabelText('Password'), password);
  await user.click(screen.getByRole('button', { name: 'Log in' }));
}

describe('LoginPage', () => {
  it.each<[Role, string]>([
    ['STUDENT', 'student home'],
    ['ADMIN', 'admin home'],
  ])('logs in a %s and shows their home page', async (role, expectedText) => {
    fetchMock.mockResolvedValue(jsonResponse(200, makeLoginResponse(role)));
    await submitLogin();
    expect(await screen.findByText(expectedText)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/login',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('shows the server message for wrong credentials', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(401, { status: 401, message: 'Invalid email or password' }),
    );
    await submitLogin();
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
  });

  it('shows the message for an unverified email', async () => {
    fetchMock.mockResolvedValue(jsonResponse(403, { status: 403, message: 'Email not verified' }));
    await submitLogin();
    expect(await screen.findByRole('alert')).toHaveTextContent('Email not verified');
  });

  it('shows field errors returned with a 400', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(400, {
        status: 400,
        message: 'Validation failed',
        details: [{ field: 'email', message: 'must be a valid email' }],
      }),
    );
    await submitLogin();
    expect(await screen.findByText('must be a valid email')).toBeInTheDocument();
  });
});