import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/components/feedback/Toast';
import { Spinner } from '@/components/feedback/Spinner';
import styles from './TenantSwitcher.module.css';

function invalidateTenantQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['products'] });
  queryClient.invalidateQueries({ queryKey: ['users'] });
  queryClient.invalidateQueries({ queryKey: ['orders'] });
  queryClient.invalidateQueries({ queryKey: ['sales-report'] });
  queryClient.invalidateQueries({ queryKey: ['tenants'] });
}

export function TenantSwitcher() {
  const { user, tenants, switchTenant, isSwitching, isRefreshingTenants } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const activeTenant = tenants.find((t) => t.id === user?.tenantId);
  const isBusy = isSwitching || isRefreshingTenants;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user || user.role !== 'admin') return null;

  const handleSelect = async (tenantId: number) => {
    if (tenantId === user.tenantId) {
      setOpen(false);
      return;
    }
    try {
      await switchTenant(tenantId);
      invalidateTenantQueries(queryClient);
      showToast('Faol do\'kon yangilandi', 'success');
      setOpen(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Xatolik yuz berdi', 'error');
    }
  };

  if (tenants.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyText}>Hali do'kon yo'q</span>
        <Link to="/admin/tenants" className={styles.createLink}>
          + Yaratish
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.wrapper} ref={containerRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((v) => !v)}
        disabled={isBusy}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className={styles.icon} aria-hidden>🏪</span>
        <span className={styles.label}>
          {activeTenant?.name ?? 'Do\'kon tanlang'}
        </span>
        {isBusy ? (
          <Spinner size="sm" />
        ) : (
          <span className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`} aria-hidden>
            ▼
          </span>
        )}
      </button>

      {open && (
        <div className={styles.dropdown} role="listbox">
          <p className={styles.dropdownTitle}>Faol do'kon</p>
          <ul className={styles.list}>
            {tenants.map((tenant) => {
              const isActive = tenant.id === user.tenantId;
              return (
                <li key={tenant.id}>
                  <button
                    type="button"
                    className={`${styles.option} ${isActive ? styles.optionActive : ''}`}
                    onClick={() => handleSelect(tenant.id)}
                    role="option"
                    aria-selected={isActive}
                  >
                    <span className={styles.check}>{isActive ? '✓' : ''}</span>
                    <span>{tenant.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className={styles.footer}>
            <Link to="/admin/tenants" className={styles.manageLink} onClick={() => setOpen(false)}>
              Do'konlarni boshqarish
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
