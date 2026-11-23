import { useState } from 'react';
import { ApiError } from '../api/client';
import type { MessageResponse } from '../api/types';
import { RESEND_COOLDOWN_SECONDS } from '../auth/constants';
import { useCooldown } from '../hooks/useCooldown';
import { Alert } from './Alert';
import { Button } from './Button';

interface ResendCodeProps {
  email: string;
  send: (email: string) => Promise<MessageResponse>;
  /** Seconds to wait before the first resend, e.g. 60 right after a code was emailed. */
  initialSeconds: number;
  /** Called after a new code was requested, e.g. to clear the code input. */
  onSent?: () => void;
}

export function ResendCode({ email, send, initialSeconds, onSent }: ResendCodeProps) {
  const { secondsLeft, start } = useCooldown(initialSeconds);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (!email.trim()) {
      setError('Enter your email first.');
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result = await send(email.trim());
      setNotice(result.message);
      start(RESEND_COOLDOWN_SECONDS);
      onSent?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      {notice && <Alert variant="success">{notice}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}
      <Button type="button" variant="secondary" onClick={handleClick} disabled={busy || secondsLeft > 0}>
        {secondsLeft > 0 ? `Resend code in ${secondsLeft}s` : 'Send a new code'}
      </Button>
    </div>
  );
}