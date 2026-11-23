import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PublicOnly } from '../auth/PublicOnly';
import { jsonResponse, makeLoginResponse, sentJson } from '../test/helpers';
import { renderAt } from '../test/render';
import { VerifyEmailPage } from './VerifyEmailPage';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

const tree = (
  <Routes>
    <Route element={<PublicOnly />}>
      <Route path="/verify-email" element={<VerifyEmailPage />} />
    </Route>
    <Route path="/student" element={<div>student home</div>} />
  </Routes>
);

const entry = (codeSent: boolean) => ({
  pathname: '/verify-email',
  state: { email: 'a@test.com', codeSent },
});

describe('VerifyEmailPage', () => {
  it('verifies the code and lands on the role home', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, makeLoginResponse('STUDENT')));
    const user = userEvent.setup();
    renderAt(tree, entry(true));
    await user.type(screen.getByLabelText('Verification code'), '123456');
    await user.click(screen.getByRole('button', { name: 'Verify' }));
    expect(await screen.findByText('student home')).toBeInTheDocument();
    expect(sentJson(fetchMock)).toEqual({ email: 'a@test.com', otp: '123456' });
  });

  it('keeps only digits and at most six of them', async () => {
    const user = userEvent.setup();
    renderAt(tree, entry(true));
    await user.type(screen.getByLabelText('Verification code'), 'ab12cd34567');
    expect(screen.getByLabelText('Verification code')).toHaveValue('123456');
  });

  it('does not call the API for a code that is not 6 digits', async () => {
    const user = userEvent.setup();
    renderAt(tree, entry(true));
    await user.type(screen.getByLabelText('Verification code'), '123');
    await user.click(screen.getByRole('button', { name: 'Verify' }));
    expect(await screen.findByText('Enter the 6-digit code.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows the server message for a wrong code', async () => {
    fetchMock.mockResolvedValue(jsonResponse(400, { status: 400, message: 'Invalid or expired code' }));
    const user = userEvent.setup();
    renderAt(tree, entry(true));
    await user.type(screen.getByLabelText('Verification code'), '000000');
    await user.click(screen.getByRole('button', { name: 'Verify' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid or expired code');
  });

  it('asks for a new code and starts the countdown', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, { message: 'If that account needs verification, a new code has been sent' }),
    );
    const user = userEvent.setup();
    renderAt(tree, entry(false));
    await user.click(screen.getByRole('button', { name: 'Send a new code' }));
    expect(
      await screen.findByText('If that account needs verification, a new code has been sent'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Resend code in \d+s/ })).toBeDisabled();
    expect(sentJson(fetchMock)).toEqual({ email: 'a@test.com' });
  });

  it('counts down from 60 after registration and then re-enables the button', () => {
    vi.useFakeTimers();
    renderAt(tree, entry(true));
    expect(screen.getByRole('button', { name: 'Resend code in 60s' })).toBeDisabled();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByRole('button', { name: 'Resend code in 59s' })).toBeDisabled();

    for (let i = 0; i < 59; i += 1) {
      act(() => {
        vi.advanceTimersByTime(1000);
      });
    }
    expect(screen.getByRole('button', { name: 'Send a new code' })).toBeEnabled();
  });
});