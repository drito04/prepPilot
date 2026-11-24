import { useEffect, useState } from 'react';
import { ApiError } from '../api/client';
import { getProfile, type Profile } from '../api/profile';
import { Alert } from '../components/Alert';
import { Button } from '../components/Button';
import { Loading } from '../components/Loading';
import { PageTitle } from '../components/PageTitle';
import { ProfileForm } from '../components/ProfileForm';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; profile: Profile };

export function ProfilePage() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getProfile()
      .then((profile) => {
        if (!cancelled) {
          setState({ status: 'ready', profile });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            status: 'error',
            message: err instanceof ApiError ? err.message : 'Could not load your profile.',
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  function retry() {
    setState({ status: 'loading' });
    setAttempt((current) => current + 1);
  }

  return (
    <section className="space-y-6">
      <PageTitle
        title="Your profile"
        description="Keep your details up to date. You can change them at any time."
      />
      {state.status === 'loading' && <Loading label="Loading your profile..." />}
      {state.status === 'error' && (
        <div className="max-w-lg space-y-3">
          <Alert variant="error">{state.message}</Alert>
          <Button type="button" variant="secondary" onClick={retry} className="sm:w-auto">
            Try again
          </Button>
        </div>
      )}
      {state.status === 'ready' && <ProfileForm initial={state.profile} />}
    </section>
  );
}