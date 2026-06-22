import type { CreateProductDto, UpdateProductDto } from '@/types';

function toDecimalString(value: number): string {
  return Number(value).toFixed(2);
}

export function buildCreateProductPayload(dto: CreateProductDto): Record<string, unknown> {
  const description = dto.description?.trim();

  return {
    name: dto.name,
    ...(description ? { description } : {}),
    quantity: dto.quantity,
    costPrice: toDecimalString(dto.costPrice),
    unitPrice: toDecimalString(dto.unitPrice),
  };
}

export function buildUpdateProductPayload(dto: UpdateProductDto): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  if (dto.name !== undefined) payload.name = dto.name;
  if (dto.description !== undefined) {
    const description = dto.description.trim();
    if (description) {
      payload.description = description;
    }
  }
  if (dto.quantity !== undefined) payload.quantity = dto.quantity;
  if (dto.costPrice !== undefined) payload.costPrice = toDecimalString(dto.costPrice);
  if (dto.unitPrice !== undefined) payload.unitPrice = toDecimalString(dto.unitPrice);

  return payload;
}
