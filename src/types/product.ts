export interface Product {
  id: number;
  name: string;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  costPrice?: number;
  tenantId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductDto {
  name: string;
  description?: string;
  quantity: number;
  costPrice: number;
  unitPrice: number;
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  quantity?: number;
  costPrice?: number;
  unitPrice?: number;
}
