import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, sentJson } from '../test/helpers';
import { renderAt } from '../test/render';
import { ForgotPasswordPage } from './ForgotPasswordPage';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

function ResetStub() {
  const state = useLocation().state as { email?: string; codeSent?: boolean } | null;
  return <div>{`reset screen for ${state?.email} sent=${String(state?.codeSent)}`}</div>;
}

const tree = (
  <Routes>
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/reset-password" element={<ResetStub />} />
  </Routes>
);

describe('ForgotPasswordPage', () => {
  it('requests a code and continues to the reset screen', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, { message: 'If that email is registered, a reset code has been sent' }),
    );
    const user = userEvent.setup();
    renderAt(tree, '/forgot-password');
    await user.type(screen.getByLabelText('Email'), 'a@test.com');
    await user.click(screen.getByRole('button', { name: 'Send reset code' }));
    expect(await screen.findByText('reset screen for a@test.com sent=true')).toBeInTheDocument();
    expect(sentJson(fetchMock)).toEqual({ email: 'a@test.com' });
  });

  it('shows field errors returned with a 400', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(400, {
        status: 400,
        message: 'Validation failed',
        details: [{ field: 'email', message: 'must be a valid email' }],
      }),
    );
    const user = userEvent.setup();
    renderAt(tree, '/forgot-password');
    await user.type(screen.getByLabelText('Email'), 'a@test.com');
    await user.click(screen.getByRole('button', { name: 'Send reset code' }));
    expect(await screen.findByText('must be a valid email')).toBeInTheDocument();
  });
});