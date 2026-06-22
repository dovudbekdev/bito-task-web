import type { Order, OrderItem, Receipt, SalesReport } from '@/types/order';
import type { Product } from '@/types/product';

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value);
  return 0;
}

export function normalizeProduct(product: Product): Product {
  return {
    ...product,
    quantity: toNumber(product.quantity),
    unitPrice: toNumber(product.unitPrice),
    costPrice: product.costPrice !== undefined ? toNumber(product.costPrice) : undefined,
  };
}

export function normalizeProducts(products: Product[]): Product[] {
  return products.map(normalizeProduct);
}

function normalizeOrderItem(item: OrderItem): OrderItem {
  return {
    ...item,
    quantity: toNumber(item.quantity),
    unitPrice: toNumber(item.unitPrice),
    costPrice: item.costPrice !== undefined ? toNumber(item.costPrice) : undefined,
    lineTotal: toNumber(item.lineTotal),
  };
}

export function normalizeOrder(order: Order): Order {
  return {
    ...order,
    totalAmount: toNumber(order.totalAmount),
    totalQuantity: toNumber(order.totalQuantity),
    items: order.items?.map(normalizeOrderItem) ?? [],
  };
}

export function normalizeOrders(orders: Order[]): Order[] {
  return orders.map(normalizeOrder);
}

export function normalizeReceipt(receipt: Receipt): Receipt {
  return {
    ...receipt,
    totalAmount: toNumber(receipt.totalAmount),
    totalQuantity: toNumber(receipt.totalQuantity),
    totalCost: receipt.totalCost !== undefined ? toNumber(receipt.totalCost) : undefined,
    totalProfit: receipt.totalProfit !== undefined ? toNumber(receipt.totalProfit) : undefined,
    items: receipt.items.map((item) => ({
      ...item,
      quantity: toNumber(item.quantity),
      unitPrice: toNumber(item.unitPrice),
      lineTotal: toNumber(item.lineTotal),
    })),
  };
}

export function normalizeSalesReport(report: SalesReport): SalesReport {
  return {
    orderCount: toNumber(report.orderCount),
    totalRevenue: toNumber(report.totalRevenue),
    totalCost: toNumber(report.totalCost),
    totalProfit: toNumber(report.totalProfit),
    averageOrderValue: toNumber(report.averageOrderValue),
  };
}
