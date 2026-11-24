import { useState, type ReactNode } from 'react';
import { fetchMe } from '../api/auth';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/useAuth';
import { PageTitle } from './PageTitle';

interface RoleHomeProps {
  title: string;
  description: string;
  children?: ReactNode;
}

export function RoleHome({ title, description, children }: RoleHomeProps) {
  const { user } = useAuth();
  const [status, setStatus] = useState<string | null>(null);

  async function checkSession() {
    setStatus('Checking...');
    try {
      const me = await fetchMe();
      setStatus(`The server says you are ${me.email} (${me.role}).`);
    } catch (err) {
      setStatus(err instanceof ApiError ? err.message : 'The request failed.');
    }
  }

  return (
    <section className="space-y-6">
      <PageTitle title={title} description={`Welcome, ${user?.fullName}. ${description}`} />
      {children}
      <div className="space-y-2">
        <button
          type="button"
          onClick={checkSession}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Call /api/me
        </button>
        {status && <p className="text-sm text-slate-700">{status}</p>}
      </div>
    </section>
  );
}