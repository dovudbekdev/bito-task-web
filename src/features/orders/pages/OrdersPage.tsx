import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dataSource } from '@/services';
import { useAuth } from '@/lib/auth/auth-context';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/feedback/Spinner';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import { useToast } from '@/components/feedback/Toast';
import { formatCurrency, formatDate, getOrderStatusLabel } from '@/lib/utils';
import type { Order, Receipt } from '@/types';
import styles from './OrdersPage.module.css';

function statusVariant(status: string): 'warning' | 'success' | 'danger' | 'default' {
  if (status === 'paid') return 'success';
  if (status === 'pending_payment') return 'warning';
  if (status === 'cancelled') return 'danger';
  return 'default';
}

export function OrdersPage() {
  const { user } = useAuth();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);
  const { showToast } = useToast();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['orders', user?.tenantId],
    queryFn: () => dataSource.getOrders(),
  });

  const handleViewReceipt = async (order: Order) => {
    if (order.status !== 'paid') return;
    setLoadingReceipt(true);
    try {
      const r = await dataSource.getReceipt(order.id);
      setReceipt(r);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Xatolik', 'error');
    } finally {
      setLoadingReceipt(false);
    }
  };

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage message={(error as Error).message} onRetry={() => refetch()} />;

  const orders = data ?? [];

  return (
    <>
      <PageHeader title="Buyurtmalar" description="Barcha buyurtmalar ro'yxati" />

      <Table<Order>
        data={orders}
        keyExtractor={(r) => r.id}
        columns={[
          { key: 'id', header: 'ID', render: (r) => `#${r.id}` },
          { key: 'status', header: 'Holat', render: (r) => <Badge variant={statusVariant(r.status)}>{getOrderStatusLabel(r.status)}</Badge> },
          { key: 'total', header: 'Summa', render: (r) => formatCurrency(r.totalAmount) },
          { key: 'qty', header: 'Miqdor', render: (r) => r.totalQuantity },
          { key: 'date', header: 'Sana', render: (r) => formatDate(r.createdAt) },
          {
            key: 'actions',
            header: '',
            render: (r) => {
              if (r.status === 'paid') {
                return (
                  <Button size="sm" variant="secondary" onClick={() => handleViewReceipt(r)} disabled={loadingReceipt}>
                    Chek
                  </Button>
                );
              }
              if (r.status === 'pending_payment') {
                return <Badge variant="warning">To'lov kutilmoqda</Badge>;
              }
              return null;
            },
          },
        ]}
      />

      <Modal open={!!receipt} title="Chek" onClose={() => setReceipt(null)} size="md">
        {receipt && (
          <div className={styles.receipt}>
            <p><strong>Do'kon:</strong> {receipt.tenantName}</p>
            <p><strong>Buyurtma:</strong> #{receipt.orderId}</p>
            <p><strong>To'langan:</strong> {formatDate(receipt.paidAt)}</p>
            <hr className={styles.divider} />
            <ul className={styles.items}>
              {receipt.items.map((item, i) => (
                <li key={i} className={styles.item}>
                  <span>{item.productName} × {item.quantity}</span>
                  <span>{formatCurrency(item.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <hr className={styles.divider} />
            <div className={styles.total}>
              <span>Jami:</span>
              <span>{formatCurrency(receipt.totalAmount)}</span>
            </div>
            {receipt.totalProfit !== undefined && (
              <div className={styles.profit}>
                <span>Foyda:</span>
                <span>{formatCurrency(receipt.totalProfit)}</span>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
