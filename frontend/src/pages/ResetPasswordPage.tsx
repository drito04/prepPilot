import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { forgotPassword, resetPassword } from '../api/auth';
import { ApiError } from '../api/client';
import { toFieldErrors } from '../api/fieldErrors';
import { RESEND_COOLDOWN_SECONDS } from '../auth/constants';
import { PASSWORD_HINT, validatePassword } from '../auth/passwordRules';
import { Alert } from '../components/Alert';
import { AuthCard } from '../components/AuthCard';
import { Button } from '../components/Button';
import { FormField } from '../components/FormField';
import { linkClass } from '../components/linkStyles';
import { ResendCode } from '../components/ResendCode';

interface ResetState {
  email?: string;
  codeSent?: boolean;
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as ResetState | null) ?? {};
  const [email, setEmail] = useState(state.email ?? '');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const errors: Record<string, string> = {};
    if (!/^\d{6}$/.test(otp)) {
      errors.otp = 'Enter the 6-digit code.';
    }
    const passwordProblem = validatePassword(newPassword);
    if (passwordProblem) {
      errors.newPassword = passwordProblem;
    }
    if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(email.trim(), otp, newPassword);
      navigate('/login', {
        replace: true,
        state: { notice: 'Your password was updated. Log in with your new password.' },
      });
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
      title="Reset your password"
      subtitle={
        state.codeSent
          ? `If ${state.email ?? 'that email'} is registered, we sent a 6-digit code to it.`
          : 'Enter the code from your email and choose a new password.'
      }
      footer={
        <Link to="/login" className={linkClass}>
          Back to log in
        </Link>
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
          label="Reset code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          required
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          error={fieldErrors.otp}
        />
        <FormField
          label="New password"
          type="password"
          autoComplete="new-password"
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          error={fieldErrors.newPassword}
          hint={PASSWORD_HINT}
        />
        <FormField
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={fieldErrors.confirmPassword}
        />
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Updating...' : 'Reset password'}
        </Button>
      </form>
      <ResendCode
        email={email}
        send={forgotPassword}
        initialSeconds={state.codeSent ? RESEND_COOLDOWN_SECONDS : 0}
        onSent={() => setOtp('')}
      />
    </AuthCard>
  );
}