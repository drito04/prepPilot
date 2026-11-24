import { Link, Navigate, Route, Routes } from 'react-router';
import { PublicOnly } from './auth/PublicOnly';
import { RequireAuth } from './auth/RequireAuth';
import { homePathFor } from './auth/roles';
import { useAuth } from './auth/useAuth';
import { Layout } from './components/Layout';
import { linkClass } from './components/linkStyles';
import { RoleHome } from './components/RoleHome';
import { ForbiddenPage } from './pages/ForbiddenPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProfilePage } from './pages/ProfilePage';
import { RegisterPage } from './pages/RegisterPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';

function RootRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? homePathFor(user.role) : '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<PublicOnly />}>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      <Route path="/forbidden" element={<ForbiddenPage />} />

      {/* Every signed-in page goes INSIDE its <Layout /> route, or it gets no header. */}
      <Route element={<RequireAuth roles={['STUDENT']} />}>
        <Route element={<Layout />}>
          <Route
            path="/student"
            element={
              <RoleHome
                title="Student dashboard"
                description="Exams, coding practice and interview scheduling will appear here."
              >
                <Link to="/student/profile" className={linkClass}>
                  Complete your profile
                </Link>
              </RoleHome>
            }
          />
          <Route path="/student/profile" element={<ProfilePage />} />
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