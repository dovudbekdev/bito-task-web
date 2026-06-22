import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import {
  normalizeOrder,
  normalizeOrders,
  normalizeProduct,
  normalizeProducts,
  normalizeReceipt,
  normalizeSalesReport,
} from '@/lib/api/normalize';
import { buildCreateProductPayload, buildUpdateProductPayload } from '@/lib/api/product-payload';
import type { PaginatedMeta } from '@/lib/api/types';
import type { IDataRepository } from './repository.interface';
import type {
  CreateOrderDto,
  CreateProductDto,
  CreateTenantDto,
  CreateUserDto,
  LoginCredentials,
  LoginResponse,
  Order,
  PaginatedResult,
  Product,
  QueryParams,
  Receipt,
  SalesReport,
  SalesReportQuery,
  SwitchTenantResponse,
  Tenant,
  UpdateProductDto,
  UpdateTenantDto,
  UpdateUserDto,
  User,
} from '@/types';

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

function toPaginated<T>(data: T[], meta: Record<string, unknown> | null): PaginatedResult<T> {
  const m = meta as PaginatedMeta | null;
  return {
    data,
    meta: m ?? { total: data.length, page: 1, limit: data.length || 10, totalPages: 1 },
  };
}

class ApiRepository implements IDataRepository {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const res = await apiPost<LoginResponse>(endpoints.auth.login, credentials, { skipAuth: true });
    return res.data;
  }

  async logout(): Promise<void> {
    await apiGet(endpoints.auth.logout);
  }

  async refresh(refreshToken: string): Promise<LoginResponse> {
    const res = await apiPost<LoginResponse>(endpoints.auth.refresh, { refreshToken }, { skipAuth: true });
    return res.data;
  }

  async switchTenant(tenantId: number): Promise<SwitchTenantResponse> {
    const res = await apiPost<SwitchTenantResponse>(endpoints.auth.switchTenant, { tenantId });
    return res.data;
  }

  async getUsers(params: QueryParams): Promise<PaginatedResult<User>> {
    const res = await apiGet<User[]>(
      `${endpoints.users}${buildQuery({ page: params.page, limit: params.limit, role: params.role })}`,
    );
    return toPaginated(res.data, res.meta);
  }

  async createUser(dto: CreateUserDto): Promise<User> {
    const res = await apiPost<User>(endpoints.users, dto);
    return res.data;
  }

  async updateUser(id: number, dto: UpdateUserDto): Promise<User> {
    const res = await apiPatch<User>(`${endpoints.users}/${id}`, dto);
    return res.data;
  }

  async deleteUser(id: number): Promise<void> {
    await apiDelete(`${endpoints.users}/${id}`);
  }

  async getTenants(params: QueryParams): Promise<PaginatedResult<Tenant>> {
    const res = await apiGet<Tenant[]>(
      `${endpoints.tenants}${buildQuery({ page: params.page, limit: params.limit })}`,
    );
    return toPaginated(res.data, res.meta);
  }

  async createTenant(dto: CreateTenantDto): Promise<Tenant> {
    const res = await apiPost<Tenant>(endpoints.tenants, dto);
    return res.data;
  }

  async updateTenant(id: number, dto: UpdateTenantDto): Promise<Tenant> {
    const res = await apiPatch<Tenant>(`${endpoints.tenants}/${id}`, dto);
    return res.data;
  }

  async deleteTenant(id: number): Promise<void> {
    await apiDelete(`${endpoints.tenants}/${id}`);
  }

  async getProducts(params: QueryParams): Promise<PaginatedResult<Product>> {
    const res = await apiGet<Product[]>(
      `${endpoints.products}${buildQuery({ page: params.page, limit: params.limit, search: params.search })}`,
    );
    return toPaginated(normalizeProducts(res.data), res.meta);
  }

  async getProduct(id: number): Promise<Product> {
    const res = await apiGet<Product>(`${endpoints.products}/${id}`);
    return normalizeProduct(res.data);
  }

  async createProduct(dto: CreateProductDto): Promise<Product> {
    const res = await apiPost<Product>(endpoints.products, buildCreateProductPayload(dto));
    return normalizeProduct(res.data);
  }

  async updateProduct(id: number, dto: UpdateProductDto): Promise<Product> {
    const res = await apiPatch<Product>(`${endpoints.products}/${id}`, buildUpdateProductPayload(dto));
    return normalizeProduct(res.data);
  }

  async deleteProduct(id: number): Promise<void> {
    await apiDelete(`${endpoints.products}/${id}`);
  }

  async getOrders(): Promise<Order[]> {
    const res = await apiGet<Order[]>(endpoints.orders);
    return normalizeOrders(res.data);
  }

  async getOrder(id: number): Promise<Order> {
    const res = await apiGet<Order>(`${endpoints.orders}/${id}`);
    return normalizeOrder(res.data);
  }

  async createOrder(dto: CreateOrderDto): Promise<Order> {
    const res = await apiPost<Order>(endpoints.orders, dto);
    return normalizeOrder(res.data);
  }

  async getReceipt(id: number): Promise<Receipt> {
    const res = await apiGet<Receipt>(`${endpoints.orders}/${id}/receipt`);
    return normalizeReceipt(res.data);
  }

  async getSalesReport(query: SalesReportQuery): Promise<SalesReport> {
    const res = await apiGet<SalesReport>(
      `${endpoints.reports.sales}${buildQuery({ from: query.from, to: query.to })}`,
    );
    return normalizeSalesReport(res.data);
  }
}

export const apiRepository = new ApiRepository();
