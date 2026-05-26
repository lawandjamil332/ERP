export interface PaginationArgs { cursor?: string | null; take?: number; }
export interface PaginationResult<T> { items: T[]; nextCursor: string | null; hasMore: boolean; }

export function readPagination(searchParams: URLSearchParams | Record<string, string | undefined>) {
  const sp = searchParams instanceof URLSearchParams ? searchParams : new URLSearchParams(searchParams as any);
  return {
    cursor: sp.get('cursor') ?? null,
    q: (sp.get('q') ?? '').trim() || null,
    take: 30,
  };
}

export function paginate<T extends { id: string }>(rows: T[], take: number): PaginationResult<T> {
  const hasMore = rows.length > take;
  const items = hasMore ? rows.slice(0, take) : rows;
  return { items, hasMore, nextCursor: hasMore ? items[items.length - 1].id : null };
}
