import { useAuth } from '@/lib/auth/auth-context';
import { getRoleLabel } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { TenantSwitcher } from './TenantSwitcher';
import styles from './TopBar.module.css';

export function TopBar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        {user.role === 'admin' && <TenantSwitcher />}
      </div>
      <div className={styles.right}>
        <div className={styles.user}>
          <span className={styles.name}>{user.name}</span>
          <Badge variant="info">{getRoleLabel(user.role)}</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={() => logout()}>
          Chiqish
        </Button>
      </div>
    </header>
  );
}
