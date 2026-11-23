import { Outlet, useNavigate } from 'react-router';
import { useAuth } from '../auth/useAuth';
import { Logo } from './Logo';

export function Layout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  function handleSignOut() {
    signOut();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-t-4 border-slate-200 border-t-accent-500 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Logo className="text-xl" />
          {/* <span className="text-lg font-semibold text-indigo-600">prepPilot</span> */}
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden sm:inline">{user?.fullName}</span>
            <span className="rounded-full bg-accent-100 px-2 py-0.5 text-xs font-medium text-accent-800">
              {user?.role}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-100"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}