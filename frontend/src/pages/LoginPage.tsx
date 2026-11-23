import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router';
import { login } from '../api/auth';
import { ApiError } from '../api/client';
import { toFieldErrors } from '../api/fieldErrors';
import { EMAIL_NOT_VERIFIED } from '../auth/constants';
import { homePathFor } from '../auth/roles';
import { useAuth } from '../auth/useAuth';
import { Alert } from '../components/Alert';
import { AuthCard } from '../components/AuthCard';
import { Button } from '../components/Button';
import { FormField } from '../components/FormField';
import { linkClass } from '../components/linkStyles';

interface LoginState {
  from?: string;
  notice?: string;
}

export function LoginPage() {
  const { user, signIn } = useAuth();
  const location = useLocation();
  const state = (location.state as LoginState | null) ?? {};
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Already signed in (or just signed in): go to the page they asked for, or their role's home.
  if (user) {
    const home = homePathFor(user.role);
    return <Navigate to={state.from?.startsWith(home) ? state.from : home} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setNeedsVerification(false);
    setFieldErrors({});
    setSubmitting(true);
    try {
      signIn(await login(email.trim(), password));
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 400 && err.details.length > 0) {
          setFieldErrors(toFieldErrors(err.details));
        } else if (err.status === 403 && err.message === EMAIL_NOT_VERIFIED) {
          setNeedsVerification(true);
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
      title="Log in"
      footer={
        <>
          New here?{' '}
          <Link to="/register" className={linkClass}>
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {state.notice && <Alert variant="success">{state.notice}</Alert>}
        {formError && <Alert variant="error">{formError}</Alert>}
        {needsVerification && (
          <Alert variant="error">
            Your email address is not verified yet.{' '}
            <Link to="/verify-email" state={{ email: email.trim(), codeSent: false }} className="font-medium underline">
              Verify it now
            </Link>
          </Alert>
        )}
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
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
        />
        <div className="text-right text-sm">
          <Link to="/forgot-password" className={linkClass}>
            Forgot your password?
          </Link>
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Logging in...' : 'Log in'}
        </Button>
      </form>
    </AuthCard>
  );
}