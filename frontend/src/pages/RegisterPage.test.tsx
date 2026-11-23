import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, sentJson } from '../test/helpers';
import { renderAt } from '../test/render';
import { RegisterPage } from './RegisterPage';

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
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/verify-email" element={<VerifyStub />} />
  </Routes>
);

interface Values {
  name: string;
  email: string;
  password: string;
  confirm: string;
}

const valid: Values = {
  name: 'Test User',
  email: 'a@test.com',
  password: 'Passw0rd!x',
  confirm: 'Passw0rd!x',
};

async function submitRegistration(overrides: Partial<Values> = {}) {
  const values = { ...valid, ...overrides };
  const user = userEvent.setup();
  renderAt(tree, '/register');
  await user.type(screen.getByLabelText('Full name'), values.name);
  await user.type(screen.getByLabelText('Email'), values.email);
  await user.type(screen.getByLabelText('Password'), values.password);
  await user.type(screen.getByLabelText('Confirm password'), values.confirm);
  await user.click(screen.getByRole('button', { name: 'Create account' }));
}

describe('RegisterPage', () => {
  it('sends the details and opens the verify screen', async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { message: 'Verification code sent to your email' }));
    await submitRegistration();
    expect(await screen.findByText('verify screen for a@test.com sent=true')).toBeInTheDocument();
    expect(sentJson(fetchMock)).toEqual({
      fullName: 'Test User',
      email: 'a@test.com',
      password: 'Passw0rd!x',
    });
  });

  it('does not call the API when the passwords differ', async () => {
    await submitRegistration({ confirm: 'Different1x' });
    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not call the API for a weak password', async () => {
    await submitRegistration({ password: 'short', confirm: 'short' });
    expect(await screen.findByText('Must be between 8 and 72 characters.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows "email already registered" on the email field', async () => {
    fetchMock.mockResolvedValue(jsonResponse(409, { status: 409, message: 'Email is already registered' }));
    await submitRegistration();
    expect(await screen.findByText('Email is already registered')).toBeInTheDocument();
  });

  it('explains a recent code and links to the verify screen on a 429', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(429, { status: 429, message: 'Please wait before requesting another code' }),
    );
    await submitRegistration();
    expect(await screen.findByRole('alert')).toHaveTextContent('Please wait before requesting another code');
    expect(screen.getByRole('link', { name: 'I have a code' })).toHaveAttribute('href', '/verify-email');
  });

  it('shows field errors returned with a 400', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(400, {
        status: 400,
        message: 'Validation failed',
        details: [{ field: 'fullName', message: 'must not be blank' }],
      }),
    );
    await submitRegistration();
    expect(await screen.findByText('must not be blank')).toBeInTheDocument();
  });
});