/**
 * GDPR Repository Interface
 *
 * Handles data access operations for GDPR requests.
 */

import { gdpr_requests } from '@prisma/client';
import { CursorPaginatedResult } from './IBaseRepository';

export interface GDPRFilters {
  requestType?: string;
  status?: string;
  customerEmail?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface GDPRStats {
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  avgResponseTime: number; // in days
  complianceRate: number; // percentage
}

export interface IGDPRRepository {
  /**
   * Find GDPR requests with cursor pagination
   */
  findWithCursor(
    options: {
      cursor?: string;
      limit?: number;
      sortField?: string;
      sortOrder?: 'asc' | 'desc';
      filters?: GDPRFilters;
    }
  ): Promise<CursorPaginatedResult<gdpr_requests>>;

  /**
   * Get GDPR statistics for an organization
   */
  getStats(): Promise<GDPRStats>;

  /**
   * Find requests by customer
   */
  findByCustomer(customerId: string): Promise<gdpr_requests[]>;

  /**
   * Find requests by type
   */
  findByType(requestType: string): Promise<gdpr_requests[]>;

  /**
   * Update request status
   */
  updateStatus(id: string, status: string, completedDate?: Date): Promise<gdpr_requests>;

  /**
   * Find overdue requests (pending for more than 30 days)
   */
  findOverdue(): Promise<gdpr_requests[]>;
}