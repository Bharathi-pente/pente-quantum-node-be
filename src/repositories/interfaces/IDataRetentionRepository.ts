/**
 * Data Retention Repository Interface
 *
 * Handles data access operations for data retention policies.
 */

import { data_retention_policies } from '@prisma/client';
import { CursorPaginatedResult } from './IBaseRepository';

export interface DataRetentionFilters {
  dataType?: string;
  autoDelete?: boolean;
}

export interface DataRetentionStats {
  totalPolicies: number;
  activePolicies: number;
  policiesDueForReview: number;
  categoriesCount: number;
}

export interface IDataRetentionRepository {
  /**
   * Find data retention policies with cursor pagination
   */
  findWithCursor(
    orgId: string,
    options: {
      cursor?: string;
      limit?: number;
      sortField?: string;
      sortOrder?: 'asc' | 'desc';
      filters?: DataRetentionFilters;
    }
  ): Promise<CursorPaginatedResult<data_retention_policies>>;

  /**
   * Get data retention statistics for an organization
   */
  getStats(orgId: string): Promise<DataRetentionStats>;

  /**
   * Find policies by data type
   */
  findByDataType(orgId: string, dataType: string): Promise<data_retention_policies[]>;

  /**
   * Update last purge date
   */
  updateLastPurgeDate(id: string, lastPurgeAt: Date): Promise<data_retention_policies>;
}