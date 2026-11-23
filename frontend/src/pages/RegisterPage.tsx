import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { register } from '../api/auth';
import { ApiError } from '../api/client';
import { toFieldErrors } from '../api/fieldErrors';
import { PASSWORD_HINT, validatePassword } from '../auth/passwordRules';
import { Alert } from '../components/Alert';
import { AuthCard } from '../components/AuthCard';
import { Button } from '../components/Button';
import { FormField } from '../components/FormField';
import { linkClass } from '../components/linkStyles';

export function RegisterPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [offerVerifyLink, setOfferVerifyLink] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setOfferVerifyLink(false);

    const errors: Record<string, string> = {};
    const passwordProblem = validatePassword(password);
    if (passwordProblem) {
      errors.password = passwordProblem;
    }
    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setSubmitting(true);
    try {
      await register(fullName.trim(), email.trim(), password);
      navigate('/verify-email', { state: { email: email.trim(), codeSent: true } });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 400 && err.details.length > 0) {
          setFieldErrors(toFieldErrors(err.details));
        } else if (err.status === 409) {
          setFieldErrors({ email: err.message });
        } else {
          setFormError(err.message);
          // 429: a code was sent recently, so the person may already have one.
          setOfferVerifyLink(err.status === 429);
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
      title="Create your account"
      subtitle="Students register here. We will email you a code to confirm your address."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className={linkClass}>
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {formError && (
          <Alert variant="error">
            {formError}{' '}
            {offerVerifyLink && (
              <Link
                to="/verify-email"
                state={{ email: email.trim(), codeSent: true }}
                className="font-medium underline"
              >
                I have a code
              </Link>
            )}
          </Alert>
        )}
        <FormField
          label="Full name"
          autoComplete="name"
          required
          maxLength={120}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          error={fieldErrors.fullName}
        />
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
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          hint={PASSWORD_HINT}
        />
        <FormField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={fieldErrors.confirmPassword}
        />
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Create account'}
        </Button>
      </form>
    </AuthCard>
  );
}