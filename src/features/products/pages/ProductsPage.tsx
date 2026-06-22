import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { dataSource } from '@/services';
import { useAuth } from '@/lib/auth/auth-context';
import { PageHeader } from '@/components/layout/PageHeader';
import { TenantRequiredState } from '@/components/layout/TenantRequiredState';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Table } from '@/components/ui/Table';
import { Spinner } from '@/components/feedback/Spinner';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import { useToast } from '@/components/feedback/Toast';
import { formatCurrency } from '@/lib/utils';
import type { Product } from '@/types';

const productSchema = z.object({
  name: z.string().min(1, 'Nom kiritilishi shart'),
  description: z.string().optional(),
  quantity: z.coerce.number().min(0, 'Miqdor 0 dan katta bo\'lishi kerak'),
  costPrice: z.coerce.number().min(0, 'Tan narx 0 dan katta'),
  unitPrice: z.coerce.number().min(0, 'Sotuv narxi 0 dan katta'),
});

type ProductForm = {
  name: string;
  description: string;
  quantity: string;
  costPrice: string;
  unitPrice: string;
};

const emptyForm: ProductForm = {
  name: '',
  description: '',
  quantity: '0',
  costPrice: '0',
  unitPrice: '0',
};

export function ProductsPage() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['products', user?.tenantId],
    queryFn: () => dataSource.getProducts({ page: 1, limit: 100 }),
    enabled: !!user?.tenantId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const parsed = productSchema.parse({
        ...form,
        quantity: Number(form.quantity),
        costPrice: Number(form.costPrice),
        unitPrice: Number(form.unitPrice),
      });
      if (editId) {
        return dataSource.updateProduct(editId, parsed);
      }
      return dataSource.createProduct(parsed);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setOpen(false);
      setForm(emptyForm);
      setEditId(null);
      showToast(editId ? 'Mahsulot yangilandi' : 'Mahsulot yaratildi', 'success');
    },
    onError: (err: Error) => showToast(err.message, 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => dataSource.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      showToast('Mahsulot o\'chirildi', 'success');
    },
    onError: (err: Error) => showToast(err.message, 'error'),
  });

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setErrors({});
    setOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditId(product.id);
    setForm({
      name: product.name,
      description: product.description ?? '',
      quantity: String(product.quantity),
      costPrice: String(product.costPrice ?? 0),
      unitPrice: String(product.unitPrice),
    });
    setErrors({});
    setOpen(true);
  };

  const handleSave = () => {
    const result = productSchema.safeParse({
      ...form,
      quantity: Number(form.quantity),
      costPrice: Number(form.costPrice),
      unitPrice: Number(form.unitPrice),
    });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    saveMutation.mutate();
  };

  if (!user?.tenantId) {
    return <TenantRequiredState featureLabel="Mahsulotlar" />;
  }

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage message={(error as Error).message} onRetry={() => refetch()} />;

  const products = data?.data ?? [];

  return (
    <>
      <PageHeader
        title="Mahsulotlar"
        description="Katalog va ombor boshqaruvi"
        actions={<Button onClick={openCreate}>Yangi mahsulot</Button>}
      />

      <Table<Product>
        data={products}
        keyExtractor={(r) => r.id}
        columns={[
          { key: 'name', header: 'Nomi', render: (r) => r.name },
          { key: 'qty', header: 'Ombor', render: (r) => r.quantity },
          { key: 'cost', header: 'Tan narx', render: (r) => formatCurrency(r.costPrice ?? 0) },
          { key: 'price', header: 'Sotuv narxi', render: (r) => formatCurrency(r.unitPrice) },
          {
            key: 'actions',
            header: '',
            render: (r) => (
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button size="sm" variant="secondary" onClick={() => openEdit(r)}>Tahrirlash</Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    if (confirm(`"${r.name}" ni o'chirishni tasdiqlaysizmi?`)) {
                      deleteMutation.mutate(r.id);
                    }
                  }}
                >
                  O'chirish
                </Button>
              </div>
            ),
          },
        ]}
      />

      <Modal
        open={open}
        title={editId ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}
        onClose={() => setOpen(false)}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Bekor</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Input label="Nomi" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
          <Input label="Tavsif (ixtiyoriy)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input label="Ombordagi miqdor" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} error={errors.quantity} />
          <Input label="Tan narx" type="number" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} error={errors.costPrice} />
          <Input label="Sotuv narxi" type="number" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} error={errors.unitPrice} />
        </div>
      </Modal>
    </>
  );
}
