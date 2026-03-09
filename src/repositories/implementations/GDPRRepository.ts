/**
 * GDPR Repository Implementation
 *
 * Handles all data access operations for GDPR requests.
 * Abstracts Prisma operations from business logic layer.
 */

import { PrismaClient, gdpr_requests } from '@prisma/client';
import { BaseRepository } from './BaseRepository';
import {
  IGDPRRepository,
  GDPRFilters,
  GDPRStats
} from '../interfaces/IGDPRRepository';
import { CursorPaginatedResult } from '../interfaces/IBaseRepository';
import {
  buildCursorWhere,
  buildPaginatedResponse,
} from '../../utils/pagination';

export class GDPRRepository extends BaseRepository<gdpr_requests> implements IGDPRRepository {
  constructor(prisma: PrismaClient) {
    super(prisma, 'gdpr_requests');
  }

  async findWithCursor(
    options: {
      cursor?: string;
      limit?: number;
      sortField?: string;
      sortOrder?: 'asc' | 'desc';
      filters?: GDPRFilters;
    }
  ): Promise<CursorPaginatedResult<gdpr_requests>> {
    const {
      cursor,
      limit = 20,
      sortField = 'requested_at',
      sortOrder = 'desc',
      filters = {},
    } = options;

    // Map created_at to requested_at since gdpr_requests uses requested_at
    const actualSortField = sortField === 'created_at' ? 'requested_at' : sortField;

    const where: any = {};

    // Apply filters
    if (filters.requestType) {
      where.request_type = filters.requestType;
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.customerEmail) {
      where.customer_email = filters.customerEmail;
    }
    if (filters.dateFrom || filters.dateTo) {
      where.requested_at = {};
      if (filters.dateFrom) {
        where.requested_at.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.requested_at.lte = filters.dateTo;
      }
    }

    const cursorWhere = buildCursorWhere(cursor, actualSortField, sortOrder);

    const requests = await this.getModel().findMany({
      where: { ...where, ...cursorWhere },
      include: {
        customers: true,
      },
      orderBy: { [actualSortField]: sortOrder },
      take: limit + 1, // +1 to check if there are more results
    });

    return buildPaginatedResponse(requests, limit, actualSortField, sortOrder);
  }

  async getStats(): Promise<GDPRStats> {
    // Since the schema doesn't have org_id, we'll get global stats
    // In a real implementation, you'd need to filter by customer relationships
    const [totalRequests, pendingRequests, completedRequests, avgResponseTimeResult] = await Promise.all([
      this.count({}),
      this.count({ status: 'pending_approval' }),
      this.count({ status: 'completed' }),
      this.prisma.$queryRaw`
        SELECT
          AVG(EXTRACT(EPOCH FROM (completed_at - requested_at))/86400) as avg_response_time
        FROM gdpr_requests
        WHERE status = 'completed' AND completed_at IS NOT NULL
      `,
    ]);

    const avgResponseTime = Array.isArray(avgResponseTimeResult) && avgResponseTimeResult.length > 0
      ? Number((avgResponseTimeResult[0] as any).avg_response_time) || 0
      : 0;

    const complianceRate = totalRequests > 0
      ? (completedRequests / totalRequests) * 100
      : 100;

    return {
      totalRequests,
      pendingRequests,
      completedRequests,
      avgResponseTime,
      complianceRate,
    };
  }

  async findByCustomer(customerId: string): Promise<gdpr_requests[]> {
    return await this.findMany({
      customer_id: customerId,
    }, {
      orderBy: { requested_at: 'desc' }
    });
  }

  async findByType(requestType: string): Promise<gdpr_requests[]> {
    return await this.findMany({
      request_type: requestType,
    }, {
      orderBy: { requested_at: 'desc' }
    });
  }

  async updateStatus(id: string, status: string, completedDate?: Date): Promise<gdpr_requests> {
    const updateData: any = {
      status,
    };

    if (completedDate) {
      updateData.completed_at = completedDate;
    }

    // Note: The schema doesn't have a download_url field, so we'll ignore it for now

    return await this.update(id, updateData);
  }

  async findOverdue(): Promise<gdpr_requests[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return await this.findMany({
      status: 'pending_approval',
      requested_at: { lte: thirtyDaysAgo },
    }, {
      orderBy: { requested_at: 'asc' }
    });
  }
}