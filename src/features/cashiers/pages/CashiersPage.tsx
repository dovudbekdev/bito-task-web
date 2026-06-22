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
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/feedback/Spinner';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import { useToast } from '@/components/feedback/Toast';
import { getRoleLabel } from '@/lib/utils';
import type { User } from '@/types';

const createCashierSchema = z.object({
  name: z.string().min(1, 'Ism kiritilishi shart'),
  login: z.string().min(3, 'Login kamida 3 belgi'),
  password: z.string().min(8, 'Parol kamida 8 belgi'),
});

const updateCashierSchema = z.object({
  name: z.string().min(1, 'Ism kiritilishi shart'),
  login: z.string().min(3, 'Login kamida 3 belgi'),
  password: z.string().refine((value) => value === '' || value.length >= 8, {
    message: 'Parol kamida 8 belgi',
  }),
});

type CashierForm = {
  name: string;
  login: string;
  password: string;
};

const emptyForm: CashierForm = {
  name: '',
  login: '',
  password: '',
};

export function CashiersPage() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<CashierForm>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['users', 'cashier', user?.tenantId],
    queryFn: () => dataSource.getUsers({ role: 'cashier', page: 1, limit: 50 }),
    enabled: !!user?.tenantId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editId) {
        const parsed = updateCashierSchema.parse(form);
        const payload = {
          name: parsed.name,
          login: parsed.login,
          ...(parsed.password ? { password: parsed.password } : {}),
        };
        return dataSource.updateUser(editId, payload);
      }

      const parsed = createCashierSchema.parse(form);
      return dataSource.createUser({ ...parsed, role: 'cashier' });
    },
    onSuccess: () => {
      const wasEdit = editId !== null;
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setOpen(false);
      setForm(emptyForm);
      setEditId(null);
      showToast(wasEdit ? 'Kassir yangilandi' : 'Kassir yaratildi', 'success');
    },
    onError: (err: Error) => showToast(err.message, 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => dataSource.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showToast('Kassir o\'chirildi', 'success');
    },
    onError: (err: Error) => showToast(err.message, 'error'),
  });

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setErrors({});
    setOpen(true);
  };

  const openEdit = (cashier: User) => {
    setEditId(cashier.id);
    setForm({
      name: cashier.name,
      login: cashier.login,
      password: '',
    });
    setErrors({});
    setOpen(true);
  };

  const handleSave = () => {
    const schema = editId ? updateCashierSchema : createCashierSchema;
    const result = schema.safeParse(form);
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
    return <TenantRequiredState featureLabel="Kassirlar" />;
  }

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage message={(error as Error).message} onRetry={() => refetch()} />;

  const cashiers = data?.data ?? [];

  return (
    <>
      <PageHeader
        title="Kassirlar"
        description="Faol tenant uchun kassirlarni boshqaring"
        actions={<Button onClick={openCreate}>Yangi kassir</Button>}
      />

      <Table<User>
        data={cashiers}
        keyExtractor={(r) => r.id}
        columns={[
          { key: 'name', header: 'Ism', render: (r) => r.name },
          { key: 'login', header: 'Login', render: (r) => r.login },
          { key: 'role', header: 'Rol', render: (r) => <Badge>{getRoleLabel(r.role)}</Badge> },
          {
            key: 'actions',
            header: '',
            render: (r) => (
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button size="sm" variant="secondary" onClick={() => openEdit(r)}>
                  Tahrirlash
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    if (confirm(`${r.name} ni o'chirishni tasdiqlaysizmi?`)) {
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
        title={editId ? 'Kassirni tahrirlash' : 'Yangi kassir'}
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Bekor</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saqlanmoqda...' : editId ? 'Saqlash' : 'Yaratish'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Input label="Ism" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
          <Input label="Login" value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} error={errors.login} />
          <Input
            label={editId ? 'Parol (ixtiyoriy — faqat o\'zgartirish uchun)' : 'Parol'}
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            error={errors.password}
          />
        </div>
      </Modal>
    </>
  );
}
