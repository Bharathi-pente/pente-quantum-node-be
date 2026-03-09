/**
 * Compliance Repository Implementation
 *
 * Handles all data access operations for compliance reports.
 * Abstracts Prisma operations from business logic layer.
 */

import { PrismaClient, compliance_reports } from '@prisma/client';
import { BaseRepository } from './BaseRepository';
import {
  IComplianceRepository,
  ComplianceFilters,
  ComplianceStats
} from '../interfaces/IComplianceRepository';
import { CursorPaginatedResult } from '../interfaces/IBaseRepository';
import {
  buildCursorWhere,
  buildPaginatedResponse,
} from '../../utils/pagination';

export class ComplianceRepository extends BaseRepository<compliance_reports> implements IComplianceRepository {
  constructor(prisma: PrismaClient) {
    super(prisma, 'compliance_reports');
  }

  async findWithCursor(
    orgId: string,
    options: {
      cursor?: string;
      limit?: number;
      sortField?: string;
      sortOrder?: 'asc' | 'desc';
      filters?: ComplianceFilters;
    }
  ): Promise<CursorPaginatedResult<compliance_reports>> {
    const {
      cursor,
      limit = 20,
      sortField = 'id',
      sortOrder = 'desc',
      filters = {},
    } = options;

    // Map created_at to id since compliance_reports doesn't have created_at
    const actualSortField = sortField === 'created_at' ? 'id' : sortField;

    const where: any = { org_id: orgId };

    // Apply filters
    if (filters.framework) {
      where.framework = filters.framework;
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.dateFrom || filters.dateTo) {
      where.last_audit_date = {};
      if (filters.dateFrom) {
        where.last_audit_date.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.last_audit_date.lte = filters.dateTo;
      }
    }

    const cursorWhere = buildCursorWhere(cursor, actualSortField, sortOrder);

    const reports = await this.getModel().findMany({
      where: { ...where, ...cursorWhere },
      orderBy: { [actualSortField]: sortOrder },
      take: limit + 1, // +1 to check if there are more results
    });

    return buildPaginatedResponse(reports, limit, actualSortField, sortOrder);
  }

  async getStats(orgId: string): Promise<ComplianceStats> {
    const [totalReports, completedReports, pendingReports, failedReports] = await Promise.all([
      this.count({ org_id: orgId }),
      this.count({ org_id: orgId, status: 'completed' }),
      this.count({ org_id: orgId, status: 'pending' }),
      this.count({ org_id: orgId, status: 'failed' }),
    ]);

    return {
      totalReports,
      completedReports,
      pendingReports,
      failedReports,
    };
  }

  async findByFramework(orgId: string, framework: string): Promise<compliance_reports[]> {
    return await this.findMany({
      org_id: orgId,
      framework,
    }, {
      orderBy: { last_audit_date: 'desc' }
    });
  }

  async updateStatus(id: string, status: string, details?: any): Promise<compliance_reports> {
    const updateData: any = {
      status,
      updated_at: new Date(),
    };

    if (details) {
      updateData.details = details;
    }

    if (status === 'completed') {
      updateData.last_audit_date = new Date();
    }

    return await this.update(id, updateData);
  }
}