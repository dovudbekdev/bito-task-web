import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/Button';
import styles from './TenantRequiredState.module.css';

interface TenantRequiredStateProps {
  featureLabel?: string;
}

export function TenantRequiredState({ featureLabel = 'Bu bo\'lim' }: TenantRequiredStateProps) {
  const { user, tenants } = useAuth();

  if (!user || user.role !== 'admin' || user.tenantId) {
    return null;
  }

  const hasTenants = tenants.length > 0;

  return (
    <div className={styles.state}>
      <div className={styles.icon} aria-hidden>🏪</div>
      <h2 className={styles.title}>
        {hasTenants ? 'Faol do\'kon tanlanmagan' : 'Avval do\'kon yarating'}
      </h2>
      <p className={styles.description}>
        {hasTenants
          ? `${featureLabel} uchun yuqoridagi menyudan faol do'konni tanlang.`
          : `${featureLabel} uchun avval kamida bitta do'kon (tenant) yaratishingiz kerak.`}
      </p>
      {!hasTenants && (
        <Link to="/admin/tenants">
          <Button>Do'kon yaratish</Button>
        </Link>
      )}
    </div>
  );
}
