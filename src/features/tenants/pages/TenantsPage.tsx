import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { dataSource } from '@/services';
import { useAuth } from '@/lib/auth/auth-context';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/feedback/Spinner';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import { useToast } from '@/components/feedback/Toast';
import { formatDate } from '@/lib/utils';
import type { Tenant } from '@/types';

const tenantSchema = z.object({
  name: z.string().min(1, 'Nom kiritilishi shart'),
});

export function TenantsPage() {
  const { user, refreshTenants, switchTenant } = useAuth();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data, isLoading, error: queryError, refetch } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => dataSource.getTenants({ page: 1, limit: 50 }),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editId) {
        return dataSource.updateTenant(editId, { name });
      }
      return dataSource.createTenant({ name });
    },
    onSuccess: async (tenant) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      await refreshTenants();

      if (!editId && tenant) {
        await switchTenant(tenant.id);
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['users'] });
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['sales-report'] });
      }

      setOpen(false);
      setName('');
      setEditId(null);
      showToast(editId ? 'Do\'kon yangilandi' : 'Do\'kon yaratildi va faol qilindi', 'success');
    },
    onError: (err: Error) => showToast(err.message, 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => dataSource.deleteTenant(id),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      await refreshTenants();
      showToast('Do\'kon o\'chirildi', 'success');
    },
    onError: (err: Error) => showToast(err.message, 'error'),
  });

  const openCreate = () => {
    setEditId(null);
    setName('');
    setError('');
    setOpen(true);
  };

  const openEdit = (tenant: Tenant) => {
    setEditId(tenant.id);
    setName(tenant.name);
    setError('');
    setOpen(true);
  };

  const handleSave = () => {
    const result = tenantSchema.safeParse({ name });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Xatolik');
      return;
    }
    setError('');
    saveMutation.mutate();
  };

  if (isLoading) return <Spinner />;
  if (queryError) return <ErrorMessage message={(queryError as Error).message} onRetry={() => refetch()} />;

  const tenants = data?.data ?? [];

  return (
    <>
      <PageHeader
        title="Do'konlar"
        description="Bizneslaringizni boshqaring"
        actions={<Button onClick={openCreate}>Yangi do'kon</Button>}
      />

      <Table<Tenant>
        data={tenants}
        keyExtractor={(r) => r.id}
        columns={[
          {
            key: 'name',
            header: 'Nomi',
            render: (r) => (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {r.name}
                {user?.tenantId === r.id && <Badge variant="success">Faol</Badge>}
              </span>
            ),
          },
          { key: 'created', header: 'Yaratilgan', render: (r) => formatDate(r.createdAt) },
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
        title={editId ? 'Do\'konni tahrirlash' : 'Yangi do\'kon'}
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Bekor</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
            </Button>
          </>
        }
      >
        <Input label="Do'kon nomi" value={name} onChange={(e) => setName(e.target.value)} error={error} />
      </Modal>
    </>
  );
}
