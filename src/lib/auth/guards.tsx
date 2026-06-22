import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth/auth-context';
import { getHomePathForRole } from '@/lib/utils';
import { Spinner } from '@/components/feedback/Spinner';
import type { UserRole } from '@/types';
import styles from './guards.module.css';

function AuthLoading() {
  return (
    <div className={styles.loading}>
      <Spinner size="lg" />
    </div>
  );
}

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <AuthLoading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export function GuestRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <AuthLoading />;
  }

  if (isAuthenticated && user) {
    return <Navigate to={getHomePathForRole(user.role)} replace />;
  }

  return <Outlet />;
}

interface RoleRouteProps {
  roles: UserRole[];
}

export function RoleRoute({ roles }: RoleRouteProps) {
  const { user } = useAuth();

  if (!user || !roles.includes(user.role)) {
    return <Navigate to={getHomePathForRole(user?.role ?? 'cashier')} replace />;
  }

  return <Outlet />;
}
