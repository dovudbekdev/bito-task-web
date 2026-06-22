export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';

export const endpoints = {
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    switchTenant: '/auth/switch-tenant',
  },
  users: '/user',
  tenants: '/tenant',
  products: '/products',
  orders: '/orders',
  reports: {
    sales: '/reports/sales',
  },
} as const;
