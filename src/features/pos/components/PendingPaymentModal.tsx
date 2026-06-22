import { useState } from 'react';
import { dataSource } from '@/services';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/feedback/Toast';
import { formatCurrency } from '@/lib/utils';
import type { Order, Receipt } from '@/types';
import styles from './PendingPaymentModal.module.css';

interface PendingPaymentModalProps {
  order: Order | null;
  onClose: () => void;
  onReceipt: (receipt: Receipt) => void;
}

export function PendingPaymentModal({ order, onClose, onReceipt }: PendingPaymentModalProps) {
  const [isChecking, setIsChecking] = useState(false);
  const { showToast } = useToast();

  if (!order) return null;

  const handleCheckReceipt = async () => {
    setIsChecking(true);
    try {
      const receipt = await dataSource.getReceipt(order.id);
      onReceipt(receipt);
      onClose();
      showToast('Chek muvaffaqiyatli yuklandi', 'success');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Buyurtma hali to\'lanmagan',
        'error',
      );
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Modal
      open={!!order}
      title="Buyurtma yaratildi"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Yopish</Button>
          <Button onClick={handleCheckReceipt} disabled={isChecking}>
            {isChecking ? 'Tekshirilmoqda...' : 'Chekni ko\'rish'}
          </Button>
        </>
      }
    >
      <div className={styles.content}>
        <div className={styles.row}>
          <span>Buyurtma raqami</span>
          <strong>#{order.id}</strong>
        </div>
        <div className={styles.row}>
          <span>Summa</span>
          <strong>{formatCurrency(order.totalAmount)}</strong>
        </div>
        <div className={styles.row}>
          <span>Holat</span>
          <Badge variant="warning">To'lov kutilmoqda</Badge>
        </div>

        <p className={styles.hint}>
          To'lov tasdiqlangach chekni ko'rish uchun &quot;Chekni ko'rish&quot; tugmasini bosing.
          Dev muhitida to'lovni webhook script orqali tasdiqlang.
        </p>
      </div>
    </Modal>
  );
}
