export type SortOrder = 'asc' | 'desc';

export interface SortOptions {
  field: string;
  order: SortOrder;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sort?: SortOptions;
}

export interface CursorPaginationParams {
  cursor?: string;
  limit: number;
  sort?: SortOptions;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CursorPaginationMeta {
  cursor: string | null;
  nextCursor: string | null;
  previousCursor: string | null;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface CursorPaginatedResult<T> {
  data: T[];
  pagination: CursorPaginationMeta;
}

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;
export const DEFAULT_SORT_ORDER: SortOrder = 'desc';

export function normalizePaginationParams(params: Partial<PaginationParams>): PaginationParams {
  const page = Math.max(1, params.page ?? DEFAULT_PAGE);
  const limit = Math.min(MAX_LIMIT, Math.max(1, params.limit ?? DEFAULT_LIMIT));

  return {
    page,
    limit,
    sort: params.sort,
  };
}

export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

export function calculateSkip(page: number, limit: number): number {
  return calculateOffset(page, limit);
}

export interface FilterOperator {
  eq?: unknown;
  ne?: unknown;
  gt?: unknown;
  gte?: unknown;
  lt?: unknown;
  lte?: unknown;
  in?: unknown[];
  notIn?: unknown[];
  contains?: string;
  startsWith?: string;
  endsWith?: string;
  isNull?: boolean;
}

export type FilterValue = string | number | boolean | Date | FilterOperator;

export interface FilterParams {
  [key: string]: FilterValue | FilterParams;
}
