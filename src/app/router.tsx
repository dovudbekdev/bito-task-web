import { Navigate, Route, Routes } from 'react-router-dom';
import { GuestRoute, ProtectedRoute, RoleRoute } from '@/lib/auth/guards';
import { AppShell } from '@/components/layout/AppShell';
import { PosLayout } from '@/components/layout/PosLayout';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { AdminsPage } from '@/features/users/pages/AdminsPage';
import { TenantsPage } from '@/features/tenants/pages/TenantsPage';
import { CashiersPage } from '@/features/cashiers/pages/CashiersPage';
import { ProductsPage } from '@/features/products/pages/ProductsPage';
import { ReportsPage } from '@/features/reports/pages/ReportsPage';
import { PosPage } from '@/features/pos/pages/PosPage';
import { OrdersPage } from '@/features/orders/pages/OrdersPage';
import { getHomePathForRole } from '@/lib/utils';
import { useAuth } from '@/lib/auth/auth-context';

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={getHomePathForRole(user.role)} replace />;
}

export function AppRouter() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<HomeRedirect />} />

        <Route element={<AppShell />}>
          <Route element={<RoleRoute roles={['super_admin']} />}>
            <Route path="/super-admin/admins" element={<AdminsPage />} />
          </Route>

          <Route element={<RoleRoute roles={['admin']} />}>
            <Route path="/admin/tenants" element={<TenantsPage />} />
            <Route path="/admin/cashiers" element={<CashiersPage />} />
            <Route path="/admin/products" element={<ProductsPage />} />
            <Route path="/admin/reports" element={<ReportsPage />} />
          </Route>

          <Route element={<RoleRoute roles={['cashier', 'admin', 'super_admin']} />}>
            <Route path="/orders" element={<OrdersPage />} />
          </Route>
        </Route>

        <Route element={<RoleRoute roles={['cashier']} />}>
          <Route element={<PosLayout />}>
            <Route path="/pos" element={<PosPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
