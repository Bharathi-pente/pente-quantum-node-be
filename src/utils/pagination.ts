/**
 * Cursor-Based Pagination Utilities
 * 
 * Provides efficient pagination for large datasets using cursor-based navigation
 * instead of OFFSET-based pagination which degrades with scale.
 * 
 * Benefits:
 * - Consistent performance regardless of dataset size
 * - No missing or duplicate items when data changes
 * - Scalable for 100k+ records
 */

export interface CursorPaginationOptions {
  limit?: number;
  cursor?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CursorPaginationResult<T> {
  data: T[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
    totalCount?: number;
  };
}

/**
 * Encode cursor from an object containing the sort field value and unique ID
 */
export function encodeCursor(value: any, id: string): string {
  const cursorData = { value, id };
  return Buffer.from(JSON.stringify(cursorData)).toString('base64');
}

/**
 * Decode cursor to extract sort field value and unique ID
 */
export function decodeCursor(cursor: string): { value: any; id: string } {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch (error) {
    throw new Error('Invalid cursor format');
  }
}

/**
 * Build Prisma where clause for cursor-based pagination
 */
export function buildCursorWhere(
  cursor: string | undefined,
  sortField: string,
  sortOrder: 'asc' | 'desc',
  additionalWhere: any = {}
) {
  if (!cursor) {
    return additionalWhere;
  }

  const { value, id } = decodeCursor(cursor);
  
  // Build comparison based on sort order
  const comparison = sortOrder === 'asc' ? 'gt' : 'lt';

  return {
    ...additionalWhere,
    OR: [
      {
        [sortField]: {
          [comparison]: value,
        },
      },
      {
        [sortField]: {
          equals: value,
        },
        id: {
          [comparison]: id,
        },
      },
    ],
  };
}

/**
 * Build paginated response with cursor metadata
 */
export function buildPaginatedResponse<T extends { id: string; [key: string]: any }>(
  items: T[],
  limit: number,
  sortField: string,
  requestedCursor?: string
): CursorPaginationResult<T> {
  const hasNextPage = items.length > limit;
  const data = hasNextPage ? items.slice(0, limit) : items;

  const startCursor = data.length > 0 ? encodeCursor(data[0][sortField], data[0].id) : null;
  const endCursor = data.length > 0 ? encodeCursor(data[data.length - 1][sortField], data[data.length - 1].id) : null;

  return {
    data,
    pageInfo: {
      hasNextPage,
      hasPreviousPage: !!requestedCursor,
      startCursor,
      endCursor,
    },
  };
}

/**
 * Legacy offset pagination support (for backward compatibility)
 */
export interface OffsetPaginationOptions {
  page?: number;
  limit?: number;
}

export interface OffsetPaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Calculate skip and take for offset pagination
 */
export function calculateOffsetPagination(page: number = 1, limit: number = 10) {
  const validPage = Math.max(1, page);
  const validLimit = Math.min(Math.max(1, limit), 100); // Max 100 items per page
  const skip = (validPage - 1) * validLimit;

  return {
    skip,
    take: validLimit,
    page: validPage,
    limit: validLimit,
  };
}

/**
 * Build offset pagination response
 */
export function buildOffsetPaginationResponse<T>(
  items: T[],
  total: number,
  page: number,
  limit: number
): OffsetPaginationResult<T> {
  const totalPages = Math.ceil(total / limit);

  return {
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}
