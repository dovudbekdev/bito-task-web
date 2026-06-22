export interface Tenant {
  id: number;
  name: string;
  userId: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTenantDto {
  name: string;
}

export interface UpdateTenantDto {
  name?: string;
}
