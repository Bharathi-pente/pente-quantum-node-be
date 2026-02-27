/**
 * Base Repository Interface
 * 
 * Provides standard CRUD operations that all repositories must implement.
 * This abstraction layer allows for:
 * - Easy testing with mock implementations
 * - Switching databases without changing business logic
 * - Consistent data access patterns across the application
 */

export interface IBaseRepository<T> {
  /**
   * Create a new entity
   */
  create(data: Partial<T>): Promise<T>;

  /**
   * Find entity by ID
   */
  findById(id: string): Promise<T | null>;

  /**
   * Find multiple entities with filters
   */
  findMany(where: any, options?: FindManyOptions): Promise<T[]>;

  /**
   * Find first entity matching criteria
   */
  findFirst(where: any): Promise<T | null>;

  /**
   * Update entity by ID
   */
  update(id: string, data: Partial<T>): Promise<T>;

  /**
   * Delete entity by ID
   */
  delete(id: string): Promise<T>;

  /**
   * Count entities matching criteria
   */
  count(where: any): Promise<number>;

  /**
   * Check if entity exists
   */
  exists(where: any): Promise<boolean>;

  /**
   * Execute operations in transaction
   */
  transaction<R>(fn: (repo: this) => Promise<R>): Promise<R>;
}

export interface FindManyOptions {
  skip?: number;
  take?: number;
  orderBy?: any;
  include?: any;
  select?: any;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CursorPaginatedResult<T> {
  data: T[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
}
