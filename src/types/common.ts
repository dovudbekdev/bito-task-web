export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginatedMeta;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}

export interface SalesReportQuery {
  from?: string;
  to?: string;
}
