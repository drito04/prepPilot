import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, sentJson } from '../test/helpers';
import { renderAt } from '../test/render';
import { LoginPage } from './LoginPage';
import { ResetPasswordPage } from './ResetPasswordPage';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

const tree = (
  <Routes>
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route path="/login" element={<LoginPage />} />
  </Routes>
);

const entry = { pathname: '/reset-password', state: { email: 'a@test.com', codeSent: true } };

async function submitReset(code = '123456', password = 'NewPassw0rd!y', confirm = 'NewPassw0rd!y') {
  const user = userEvent.setup();
  renderAt(tree, entry);
  await user.type(screen.getByLabelText('Reset code'), code);
  await user.type(screen.getByLabelText('New password'), password);
  await user.type(screen.getByLabelText('Confirm new password'), confirm);
  await user.click(screen.getByRole('button', { name: 'Reset password' }));
}

describe('ResetPasswordPage', () => {
  it('resets the password and returns to login with a notice', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { message: 'Password updated. You can now log in.' }));
    await submitReset();
    expect(
      await screen.findByText('Your password was updated. Log in with your new password.'),
    ).toBeInTheDocument();
    expect(sentJson(fetchMock)).toEqual({
      email: 'a@test.com',
      otp: '123456',
      newPassword: 'NewPassw0rd!y',
    });
  });

  it('does not call the API when the passwords differ', async () => {
    await submitReset('123456', 'NewPassw0rd!y', 'Different1x');
    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not call the API for a weak new password', async () => {
    await submitReset('123456', 'short', 'short');
    expect(await screen.findByText('Must be between 8 and 72 characters.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows the server message for a wrong code', async () => {
    fetchMock.mockResolvedValue(jsonResponse(400, { status: 400, message: 'Invalid or expired code' }));
    await submitReset();
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid or expired code');
  });
});