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

export interface IDataRepository {
  login(credentials: LoginCredentials): Promise<LoginResponse>;
  logout(): Promise<void>;
  refresh(refreshToken: string): Promise<LoginResponse>;
  switchTenant(tenantId: number): Promise<SwitchTenantResponse>;

  getUsers(params: QueryParams): Promise<PaginatedResult<User>>;
  createUser(dto: CreateUserDto): Promise<User>;
  updateUser(id: number, dto: UpdateUserDto): Promise<User>;
  deleteUser(id: number): Promise<void>;

  getTenants(params: QueryParams): Promise<PaginatedResult<Tenant>>;
  createTenant(dto: CreateTenantDto): Promise<Tenant>;
  updateTenant(id: number, dto: UpdateTenantDto): Promise<Tenant>;
  deleteTenant(id: number): Promise<void>;

  getProducts(params: QueryParams): Promise<PaginatedResult<Product>>;
  getProduct(id: number): Promise<Product>;
  createProduct(dto: CreateProductDto): Promise<Product>;
  updateProduct(id: number, dto: UpdateProductDto): Promise<Product>;
  deleteProduct(id: number): Promise<void>;

  getOrders(): Promise<Order[]>;
  getOrder(id: number): Promise<Order>;
  createOrder(dto: CreateOrderDto): Promise<Order>;
  getReceipt(id: number): Promise<Receipt>;

  getSalesReport(query: SalesReportQuery): Promise<SalesReport>;
}
