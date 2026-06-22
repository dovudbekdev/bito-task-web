import { Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getRoleLabel } from '@/lib/utils';
import styles from './PosLayout.module.css';

export function PosLayout() {
  const { user, logout } = useAuth();

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.logo}>BITO POS</span>
          {user && (
            <div className={styles.user}>
              <span>{user.name}</span>
              <Badge variant="info">{getRoleLabel(user.role)}</Badge>
            </div>
          )}
        </div>
        <Button variant="ghost" onClick={() => logout()}>
          Chiqish
        </Button>
      </header>
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}
