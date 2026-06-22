import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dataSource } from '@/services';
import { useAuth } from '@/lib/auth/auth-context';
import { PageHeader } from '@/components/layout/PageHeader';
import { TenantRequiredState } from '@/components/layout/TenantRequiredState';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/feedback/Spinner';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import { formatCurrency } from '@/lib/utils';
import styles from './ReportsPage.module.css';

export function ReportsPage() {
  const { user } = useAuth();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['sales-report', from, to, user?.tenantId],
    queryFn: () => dataSource.getSalesReport({ from: from || undefined, to: to || undefined }),
    enabled: user?.role === 'admin' || user?.role === 'super_admin',
  });

  if (user?.role === 'admin' && !user.tenantId) {
    return <TenantRequiredState featureLabel="Hisobotlar" />;
  }

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage message={(error as Error).message} onRetry={() => refetch()} />;

  const report = data ?? {
    orderCount: 0,
    totalRevenue: 0,
    totalCost: 0,
    totalProfit: 0,
    averageOrderValue: 0,
  };

  return (
    <>
      <PageHeader
        title="Sotuv hisoboti"
        description="Faqat to'langan buyurtmalar hisobga olinadi"
      />

      <div className={styles.filters}>
        <Input label="Dan" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input label="Gacha" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>

      <div className={styles.grid}>
        <Card title="Buyurtmalar soni">
          <p className={styles.value}>{report.orderCount}</p>
        </Card>
        <Card title="Jami tushum">
          <p className={styles.value}>{formatCurrency(report.totalRevenue)}</p>
        </Card>
        <Card title="Jami xarajat">
          <p className={styles.value}>{formatCurrency(report.totalCost)}</p>
        </Card>
        <Card title="Jami foyda">
          <p className={`${styles.value} ${styles.profit}`}>{formatCurrency(report.totalProfit)}</p>
        </Card>
        <Card title="O'rtacha buyurtma">
          <p className={styles.value}>{formatCurrency(report.averageOrderValue)}</p>
        </Card>
      </div>
    </>
  );
}
