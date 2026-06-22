import { useMemo, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dataSource } from '@/services';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/feedback/Spinner';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import { useToast } from '@/components/feedback/Toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Order, Product, Receipt } from '@/types';
import { PendingPaymentModal } from '../components/PendingPaymentModal';
import styles from './PosPage.module.css';

interface CartItem {
  productId: number;
  name: string;
  unitPrice: number;
  quantity: number;
  maxQuantity: number;
}

export function PosPage() {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['products', 'pos', search],
    queryFn: () => dataSource.getProducts({ search, page: 1, limit: 50 }),
    placeholderData: keepPreviousData,
  });

  const orderMutation = useMutation({
    mutationFn: () =>
      dataSource.createOrder({
        items: cart.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      }),
    onSuccess: async (order) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setCart([]);
      showToast('Buyurtma muvaffaqiyatli yaratildi', 'success');

      if (order.status === 'paid') {
        try {
          const r = await dataSource.getReceipt(order.id);
          setReceipt(r);
        } catch {
          // receipt optional
        }
      } else {
        setPendingOrder(order);
      }
    },
    onError: (err: Error) => showToast(err.message, 'error'),
  });

  const products = data?.data ?? [];

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [cart],
  );

  const addToCart = (product: Product) => {
    if (product.quantity <= 0) {
      showToast('Mahsulot omborda yo\'q', 'error');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) {
          showToast('Omborda yetarli emas', 'error');
          return prev;
        }
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          unitPrice: product.unitPrice,
          quantity: 1,
          maxQuantity: product.quantity,
        },
      ];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId !== productId) return item;
          const next = item.quantity + delta;
          if (next <= 0) return null;
          if (next > item.maxQuantity) {
            showToast('Omborda yetarli emas', 'error');
            return item;
          }
          return { ...item, quantity: next };
        })
        .filter(Boolean) as CartItem[],
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  if (isLoading && !data) return <Spinner />;
  if (error && !data) return <ErrorMessage message={(error as Error).message} onRetry={() => refetch()} />;

  return (
    <div className={styles.pos}>
      <section className={styles.catalog}>
        <Input
          label="Mahsulot qidirish"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Nom bo'yicha qidirish..."
        />
        <div className={styles.grid}>
          {products.map((product) => (
            <button
              key={product.id}
              type="button"
              className={styles.productCard}
              onClick={() => addToCart(product)}
              disabled={product.quantity <= 0}
            >
              <span className={styles.productName}>{product.name}</span>
              <span className={styles.productPrice}>{formatCurrency(product.unitPrice)}</span>
              <span className={styles.productStock}>Ombor: {product.quantity}</span>
            </button>
          ))}
          {products.length === 0 && (
            <p className={styles.empty}>Mahsulot topilmadi</p>
          )}
        </div>
      </section>

      <aside className={styles.cart}>
        <h2 className={styles.cartTitle}>Savat</h2>
        {cart.length === 0 ? (
          <p className={styles.emptyCart}>Savat bo'sh</p>
        ) : (
          <ul className={styles.cartItems}>
            {cart.map((item) => (
              <li key={item.productId} className={styles.cartItem}>
                <div className={styles.cartItemInfo}>
                  <span className={styles.cartItemName}>{item.name}</span>
                  <span className={styles.cartItemPrice}>
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </span>
                </div>
                <div className={styles.cartItemActions}>
                  <Button size="sm" variant="secondary" onClick={() => updateQuantity(item.productId, -1)}>−</Button>
                  <span>{item.quantity}</span>
                  <Button size="sm" variant="secondary" onClick={() => updateQuantity(item.productId, 1)}>+</Button>
                  <Button size="sm" variant="ghost" onClick={() => removeFromCart(item.productId)}>✕</Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className={styles.cartFooter}>
          <div className={styles.cartTotal}>
            <span>Jami:</span>
            <span className={styles.totalAmount}>{formatCurrency(total)}</span>
          </div>
          <Button
            size="lg"
            fullWidth
            disabled={cart.length === 0 || orderMutation.isPending}
            onClick={() => orderMutation.mutate()}
          >
            {orderMutation.isPending ? 'Jarayonda...' : 'Buyurtma berish'}
          </Button>
        </div>
      </aside>

      <PendingPaymentModal
        order={pendingOrder}
        onClose={() => setPendingOrder(null)}
        onReceipt={setReceipt}
      />

      <Modal open={!!receipt} title="Chek" onClose={() => setReceipt(null)}>
        {receipt && (
          <div className={styles.receipt}>
            <p><strong>{receipt.tenantName}</strong></p>
            <p>#{receipt.orderId} — {formatDate(receipt.paidAt)}</p>
            <hr />
            {receipt.items.map((item, i) => (
              <div key={i} className={styles.receiptRow}>
                <span>{item.productName} × {item.quantity}</span>
                <span>{formatCurrency(item.lineTotal)}</span>
              </div>
            ))}
            <hr />
            <div className={styles.receiptRow}>
              <strong>Jami</strong>
              <strong>{formatCurrency(receipt.totalAmount)}</strong>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
