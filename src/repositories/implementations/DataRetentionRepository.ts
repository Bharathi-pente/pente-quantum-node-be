/**
 * Data Retention Repository Implementation
 *
 * Handles all data access operations for data retention policies.
 * Abstracts Prisma operations from business logic layer.
 */

import { PrismaClient, data_retention_policies } from '@prisma/client';
import { BaseRepository } from './BaseRepository';
import {
  IDataRetentionRepository,
  DataRetentionFilters,
  DataRetentionStats
} from '../interfaces/IDataRetentionRepository';
import { CursorPaginatedResult } from '../interfaces/IBaseRepository';
import {
  buildCursorWhere,
  buildPaginatedResponse,
} from '../../utils/pagination';

export class DataRetentionRepository extends BaseRepository<data_retention_policies> implements IDataRetentionRepository {
  constructor(prisma: PrismaClient) {
    super(prisma, 'data_retention_policies');
  }

  async findWithCursor(
    orgId: string,
    options: {
      cursor?: string;
      limit?: number;
      sortField?: string;
      sortOrder?: 'asc' | 'desc';
      filters?: DataRetentionFilters;
    }
  ): Promise<CursorPaginatedResult<data_retention_policies>> {
    const {
      cursor,
      limit = 20,
      sortField = 'id',
      sortOrder = 'desc',
      filters = {},
    } = options;

    // Map created_at to id since data_retention_policies doesn't have created_at
    const actualSortField = sortField === 'created_at' ? 'id' : sortField;

    const where: any = { org_id: orgId };

    // Apply filters
    if (filters.dataType) {
      where.data_type = filters.dataType;
    }
    if (filters.autoDelete !== undefined) {
      where.auto_delete = filters.autoDelete;
    }

    const cursorWhere = buildCursorWhere(cursor, actualSortField, sortOrder);

    const policies = await this.getModel().findMany({
      where: { ...where, ...cursorWhere },
      orderBy: { [actualSortField]: sortOrder },
      take: limit + 1, // +1 to check if there are more results
    });

    return buildPaginatedResponse(policies, limit, actualSortField, sortOrder);
  }

  async getStats(orgId: string): Promise<DataRetentionStats> {
    const [totalPolicies, activePolicies] = await Promise.all([
      this.count({ org_id: orgId }),
      this.count({ org_id: orgId, auto_delete: true }),
    ]);

    // For now, we'll set these to 0 since the schema doesn't have status or review dates
    const policiesDueForReview = 0;
    const categoriesCount = 0;

    return {
      totalPolicies,
      activePolicies,
      policiesDueForReview,
      categoriesCount,
    };
  }

  async findByDataType(orgId: string, dataType: string): Promise<data_retention_policies[]> {
    return await this.findMany({
      org_id: orgId,
      data_type: dataType,
    }, {
      orderBy: { retention_period: 'desc' }
    });
  }

  async updateLastPurgeDate(id: string, lastPurgeAt: Date): Promise<data_retention_policies> {
    return await this.update(id, {
      last_purge_at: lastPurgeAt,
    });
  }
}