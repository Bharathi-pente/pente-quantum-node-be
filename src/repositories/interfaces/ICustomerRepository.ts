/**
 * Customer Repository Interface
 * 
 * Defines customer-specific data access methods beyond base CRUD operations.
 */

import { IBaseRepository, CursorPaginatedResult } from './IBaseRepository';
import { customers } from '@prisma/client';

export interface ICustomerRepository extends IBaseRepository<customers> {
  /**
   * Find customer by email within an organization
   */
  findByEmail(orgId: string, email: string): Promise<customers | null>;

  /**
   * Find customers with cursor-based pagination
   */
  findWithCursor(
    orgId: string,
    options: {
      cursor?: string;
      limit?: number;
      sortField?: string;
      sortOrder?: 'asc' | 'desc';
      filters?: CustomerFilters;
    }
  ): Promise<CursorPaginatedResult<customers>>;

  /**
   * Update customer credit balance
   */
  updateCreditBalance(id: string, amount: number): Promise<customers>;

  /**
   * Get customer statistics for an organization
   */
  getStats(orgId: string): Promise<CustomerStats>;

  /**
   * Find customers by product
   */
  findByProduct(productId: string): Promise<customers[]>;

  /**
   * Find customers by status
   */
  findByStatus(orgId: string, status: string): Promise<customers[]>;
}

export interface CustomerFilters {
  status?: string;
  product_id?: string;
  search?: string;
}

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  trialCustomers: number;
  churnedCustomers: number;
  totalMRR: number;
  averageMRR: number;
}
