/**
 * Compliance Repository Interface
 *
 * Handles data access operations for compliance reports.
 */

import { compliance_reports } from '@prisma/client';
import { CursorPaginatedResult } from './IBaseRepository';

export interface ComplianceFilters {
  framework?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface ComplianceStats {
  totalReports: number;
  completedReports: number;
  pendingReports: number;
  failedReports: number;
}

export interface IComplianceRepository {
  /**
   * Find compliance reports with cursor pagination
   */
  findWithCursor(
    orgId: string,
    options: {
      cursor?: string;
      limit?: number;
      sortField?: string;
      sortOrder?: 'asc' | 'desc';
      filters?: ComplianceFilters;
    }
  ): Promise<CursorPaginatedResult<compliance_reports>>;

  /**
   * Get compliance statistics for an organization
   */
  getStats(orgId: string): Promise<ComplianceStats>;

  /**
   * Find reports by framework
   */
  findByFramework(orgId: string, framework: string): Promise<compliance_reports[]>;

  /**
   * Update report status
   */
  updateStatus(id: string, status: string, details?: any): Promise<compliance_reports>;
}