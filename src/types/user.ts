export type UserRole = 'super_admin' | 'admin' | 'cashier';

export interface User {
  id: number;
  name: string;
  login: string;
  role: UserRole;
  tenantId: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserDto {
  name: string;
  login: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserDto {
  name?: string;
  login?: string;
  password?: string;
  role?: UserRole;
}
