import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router';
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

function VerifyStub() {
  const state = useLocation().state as { email?: string; codeSent?: boolean } | null;
  return <div>{`verify screen for ${state?.email} sent=${String(state?.codeSent)}`}</div>;
}

const tree = (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/student" element={<div>student home</div>} />
    <Route path="/admin" element={<div>admin home</div>} />
    <Route path="/verify-email" element={<VerifyStub />} />
  </Routes>
);

async function submitLogin(email = 'a@test.com', password = 'Passw0rd!x') {
  const user = userEvent.setup();
  renderAt(tree, '/login');
  await user.type(screen.getByLabelText('Email'), email);
  await user.type(screen.getByLabelText('Password'), password);
  await user.click(screen.getByRole('button', { name: 'Log in' }));
  return user;
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

  it('offers to verify the email when the account is unverified', async () => {
    fetchMock.mockResolvedValue(jsonResponse(403, { status: 403, message: 'Email not verified' }));
    await submitLogin();
    expect(await screen.findByRole('alert')).toHaveTextContent('not verified');
    expect(screen.getByRole('link', { name: 'Verify it now' })).toHaveAttribute('href', '/verify-email');
  });

  it('opens the verify screen with the typed email', async () => {
    fetchMock.mockResolvedValue(jsonResponse(403, { status: 403, message: 'Email not verified' }));
    const user = await submitLogin();
    await user.click(await screen.findByRole('link', { name: 'Verify it now' }));
    expect(await screen.findByText('verify screen for a@test.com sent=false')).toBeInTheDocument();
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

  it('shows the notice passed from the password reset screen', () => {
    renderAt(tree, {
      pathname: '/login',
      state: { notice: 'Your password was updated. Log in with your new password.' },
    });
    expect(
      screen.getByText('Your password was updated. Log in with your new password.'),
    ).toBeInTheDocument();
  });

  it('links to registration and password reset', () => {
    renderAt(tree, '/login');
    expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute('href', '/register');
    expect(screen.getByRole('link', { name: 'Forgot your password?' })).toHaveAttribute(
      'href',
      '/forgot-password',
    );
  });
});