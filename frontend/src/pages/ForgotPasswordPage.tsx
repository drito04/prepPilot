import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { forgotPassword } from '../api/auth';
import { ApiError } from '../api/client';
import { toFieldErrors } from '../api/fieldErrors';
import { Alert } from '../components/Alert';
import { AuthCard } from '../components/AuthCard';
import { Button } from '../components/Button';
import { FormField } from '../components/FormField';
import { linkClass } from '../components/linkStyles';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setSubmitting(true);
    try {
      await forgotPassword(email.trim());
      // Always continue, whether or not the account exists: the answer must not reveal it.
      navigate('/reset-password', { state: { email: email.trim(), codeSent: true } });
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
      title="Forgot your password?"
      subtitle="Enter your email and we will send you a code to reset it."
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
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Sending...' : 'Send reset code'}
        </Button>
      </form>
    </AuthCard>
  );
}