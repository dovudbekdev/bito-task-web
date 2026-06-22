import type { Tenant } from './tenant';
import type { User } from './user';

export interface LoginCredentials {
  login: string;
  password: string;
}

export interface AuthUser {
  id: number;
  name: string;
  login: string;
  role: User['role'];
  tenantId: number | null;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  tenants?: Tenant[];
}

export interface SwitchTenantResponse extends LoginResponse {
  tenant?: Tenant;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  tenants: Tenant[];
}
