import { Navigate, Route, Routes } from 'react-router';
import { RequireAuth } from './auth/RequireAuth';
import { homePathFor } from './auth/roles';
import { useAuth } from './auth/useAuth';
import { Layout } from './components/Layout';
import { RoleHome } from './components/RoleHome';
import { ForbiddenPage } from './pages/ForbiddenPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';

function RootRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? homePathFor(user.role) : '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forbidden" element={<ForbiddenPage />} />

      <Route element={<RequireAuth roles={['STUDENT']} />}>
        <Route element={<Layout />}>
          <Route
            path="/student"
            element={
              <RoleHome
                title="Student dashboard"
                description="Exams, coding practice and interview scheduling will appear here."
              />
            }
          />
        </Route>
      </Route>

      <Route element={<RequireAuth roles={['INTERVIEWER']} />}>
        <Route element={<Layout />}>
          <Route
            path="/interviewer"
            element={
              <RoleHome
                title="Interviewer dashboard"
                description="Your scheduled interviews and candidate feedback will appear here."
              />
            }
          />
        </Route>
      </Route>

      <Route element={<RequireAuth roles={['ADMIN']} />}>
        <Route element={<Layout />}>
          <Route
            path="/admin"
            element={
              <RoleHome
                title="Admin dashboard"
                description="User management, the question bank and exam setup will appear here."
              />
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}