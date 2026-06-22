import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { dataSource } from '@/services';
import { PageHeader } from '@/components/layout/PageHeader';
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

const createAdminSchema = z.object({
  name: z.string().min(1, 'Ism kiritilishi shart'),
  login: z.string().min(3, 'Login kamida 3 belgi'),
  password: z.string().min(8, 'Parol kamida 8 belgi'),
});

export function AdminsPage() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', login: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['users', 'admin'],
    queryFn: () => dataSource.getUsers({ role: 'admin', page: 1, limit: 50 }),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      dataSource.createUser({ ...form, role: 'admin' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setOpen(false);
      setForm({ name: '', login: '', password: '' });
      showToast('Admin muvaffaqiyatli yaratildi', 'success');
    },
    onError: (err: Error) => showToast(err.message, 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => dataSource.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showToast('Admin o\'chirildi', 'success');
    },
    onError: (err: Error) => showToast(err.message, 'error'),
  });

  const handleCreate = () => {
    const result = createAdminSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    createMutation.mutate();
  };

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage message={(error as Error).message} onRetry={() => refetch()} />;

  const admins = data?.data ?? [];

  return (
    <>
      <PageHeader
        title="Adminlar"
        description="Super admin yangi admin foydalanuvchilarni yaratadi"
        actions={
          <Button onClick={() => setOpen(true)}>Yangi admin</Button>
        }
      />

      <Table<User>
        data={admins}
        keyExtractor={(row) => row.id}
        columns={[
          { key: 'name', header: 'Ism', render: (r) => r.name },
          { key: 'login', header: 'Login', render: (r) => r.login },
          { key: 'role', header: 'Rol', render: (r) => <Badge>{getRoleLabel(r.role)}</Badge> },
          {
            key: 'actions',
            header: '',
            render: (r) => (
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
            ),
          },
        ]}
      />

      <Modal
        open={open}
        title="Yangi admin"
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Bekor</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Saqlanmoqda...' : 'Yaratish'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Input label="Ism" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
          <Input label="Login" value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} error={errors.login} />
          <Input label="Parol" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={errors.password} />
        </div>
      </Modal>
    </>
  );
}
