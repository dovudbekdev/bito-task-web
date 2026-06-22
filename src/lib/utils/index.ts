export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: 'UZS',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('uz-UZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    cashier: 'Kassir',
  };
  return labels[role] ?? role;
}

export function getOrderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending_payment: 'To\'lov kutilmoqda',
    paid: 'To\'langan',
    cancelled: 'Bekor qilingan',
  };
  return labels[status] ?? status;
}

export function getHomePathForRole(role: string): string {
  switch (role) {
    case 'super_admin':
      return '/super-admin/admins';
    case 'admin':
      return '/admin/tenants';
    case 'cashier':
      return '/pos';
    default:
      return '/login';
  }
}
