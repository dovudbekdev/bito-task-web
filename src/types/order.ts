export type OrderStatus = 'pending_payment' | 'paid' | 'cancelled';

export interface OrderItem {
  id?: number;
  productId?: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  costPrice?: number;
  lineTotal: number;
}

export interface Order {
  id: number;
  status: OrderStatus;
  totalAmount: number;
  totalQuantity: number;
  paidAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  tenantId?: number;
  tenant?: { id: number; name: string };
  cashierId?: number;
  cashier?: { id: number; name: string };
  items: OrderItem[];
}

export interface CreateOrderDto {
  items: Array<{ productId: number; quantity: number }>;
}

export interface Receipt {
  orderId: number;
  paidAt: string | null;
  tenantName: string;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  totalAmount: number;
  totalQuantity: number;
  totalCost?: number;
  totalProfit?: number;
}

export interface SalesReport {
  orderCount: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  averageOrderValue: number;
}
