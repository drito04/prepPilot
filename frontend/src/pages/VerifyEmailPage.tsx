import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router';
import { resendVerification, verifyEmail } from '../api/auth';
import { ApiError } from '../api/client';
import { toFieldErrors } from '../api/fieldErrors';
import { RESEND_COOLDOWN_SECONDS } from '../auth/constants';
import { useAuth } from '../auth/useAuth';
import { Alert } from '../components/Alert';
import { AuthCard } from '../components/AuthCard';
import { Button } from '../components/Button';
import { FormField } from '../components/FormField';
import { linkClass } from '../components/linkStyles';
import { ResendCode } from '../components/ResendCode';

interface VerifyState {
  email?: string;
  codeSent?: boolean;
}

export function VerifyEmailPage() {
  const { signIn } = useAuth();
  const location = useLocation();
  const state = (location.state as VerifyState | null) ?? {};
  const [email, setEmail] = useState(state.email ?? '');
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    if (!/^\d{6}$/.test(otp)) {
      setFieldErrors({ otp: 'Enter the 6-digit code.' });
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    try {
      // Core returns the same body as login, so verifying also signs the user in.
      signIn(await verifyEmail(email.trim(), otp));
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 400 && err.details.length > 0) {
          setFieldErrors(toFieldErrors(err.details));
        } else {
          setFormError(err.message);
        }
      } else {
        setFormError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Verify your email"
      subtitle={
        state.codeSent
          ? `We sent a 6-digit code to ${state.email ?? 'your email'}. Codes expire after a few minutes.`
          : 'Enter the 6-digit code from your email, or ask for a new one.'
      }
      footer={
        <>
          Already verified?{' '}
          <Link to="/login" className={linkClass}>
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {formError && <Alert variant="error">{formError}</Alert>}
        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
        />
        <FormField
          label="Verification code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          required
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          error={fieldErrors.otp}
        />
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Verifying...' : 'Verify'}
        </Button>
      </form>
      <ResendCode
        email={email}
        send={resendVerification}
        initialSeconds={state.codeSent ? RESEND_COOLDOWN_SECONDS : 0}
        onSent={() => setOtp('')}
      />
    </AuthCard>
  );
}