import { NavLink, Outlet, useNavigate } from 'react-router';
import { navFor } from '../auth/roles';
import { useAuth } from '../auth/useAuth';
import { Logo } from './Logo';

export function Layout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const links = user ? navFor(user.role) : [];

  function handleSignOut() {
    signOut();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-t-4 border-slate-200 border-t-accent-500 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Logo className="text-xl" />
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
        <nav aria-label="Main" className="mx-auto flex max-w-5xl gap-4 overflow-x-auto px-4">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `whitespace-nowrap border-b-2 px-1 py-2 text-sm font-medium ${
                  isActive
                    ? 'border-accent-500 text-brand-700'
                    : 'border-transparent text-slate-600 hover:text-brand-700'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}