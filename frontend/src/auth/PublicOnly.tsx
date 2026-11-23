import { Navigate, Outlet } from 'react-router';
import { homePathFor } from './roles';
import { useAuth } from './useAuth';

/** Layout route for pages meant for visitors (register, verify, reset). Signed-in users go home. */
export function PublicOnly() {
  const { user } = useAuth();
  return user ? <Navigate to={homePathFor(user.role)} replace /> : <Outlet />;
}