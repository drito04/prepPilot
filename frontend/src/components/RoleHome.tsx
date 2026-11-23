import { useState } from 'react';
import { fetchMe } from '../api/auth';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/useAuth';

interface RoleHomeProps {
  title: string;
  description: string;
}

export function RoleHome({ title, description }: RoleHomeProps) {
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
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <div className="mt-2 h-1 w-12 rounded-full bg-accent-500" />
      </div>
      <p className="text-slate-600">Welcome, {user?.fullName}. {description}</p>
      <div className="space-y-2">
        <button
          type="button"
          onClick={checkSession}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Call /api/me
        </button>
        {status && <p className="text-sm text-slate-700">{status}</p>}
      </div>
    </section>
  );
}