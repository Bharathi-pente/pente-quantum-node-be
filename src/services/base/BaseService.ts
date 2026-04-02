/**
 * BaseService - Generic CRUD Operations
 * 
 * Provides standardized create, read, update, delete operations for all entities.
 * Eliminates code duplication across 37+ services.
 * 
 * Usage:
 *   class CustomerService extends BaseService<customers> {
 *     constructor() {
 *       super('customers', prisma.customers);
 *     }
 *   }
 */

import ApiError from '../../utils/ApiError';
import { AuditLogger } from '../../utils/audit-logger';
import { calculateOffsetPagination, buildOffsetPaginationResponse, OffsetPaginationResult } from '../../utils/pagination';

export interface BaseServiceConfig {
  /**
   * Enable audit logging for this service
   */
  auditLogging?: boolean;
  
  /**
   * Fields to select in findAll (leave undefined for all fields)
   */
  selectFields?: Record<string, boolean>;
  
  /**
   * Default relations to include
   */
  include?: Record<string, any>;
  
  /**
   * Searchable text fields for search filter
   */
  searchableFields?: string[];
  
  /**
   * Soft delete field name (e.g., 'deleted_at')
   */
  softDeleteField?: string;
}

export interface FindAllFilters {
  search?: string;
  status?: string;
  [key: string]: any;
}

export abstract class BaseService<T extends { id: string; [key: string]: any }> {
  protected modelName: string;
  protected model: any;
  protected config: BaseServiceConfig;

  constructor(modelName: string, model: any, config: BaseServiceConfig = {}) {
    this.modelName = modelName;
    this.model = model;
    this.config = {
      auditLogging: true,
      ...config,
    };
  }

  /**
   * Create a new record
   */
  async create(data: Partial<T>, request?: any): Promise<T> {
    try {
      const record = await this.model.create({
        data: this.beforeCreate(data, request),
        ...(this.config.include && { include: this.config.include }),
      });

      if (this.config.auditLogging && data.org_id) {
        await AuditLogger.logSuccess(
          data.org_id as string,
          request?.user?.email || 'system',
          `${this.modelName}.create`,
          this.getRecordLabel(record),
          record.id,
          data,
          request
        );
      }

      return record;
    } catch (error: any) {
      if (this.config.auditLogging && data.org_id) {
        await AuditLogger.logFailure(
          data.org_id as string,
          request?.user?.email || 'unknown',
          `${this.modelName}.create`,
          this.getRecordLabel(data),
          null,
          { error: error.message },
          request
        );
      }

      this.handlePrismaError(error);
      throw error;
    }
  }

  /**
   * Find all records with pagination
   */
  async findAll(
    orgId: string | undefined,
    page = 1,
    limit = 10,
    filters: FindAllFilters = {}
  ): Promise<OffsetPaginationResult<T>> {
    const { skip, take } = calculateOffsetPagination(page, limit);
    const where = this.buildWhereClause(orgId, filters);

    const [items, total] = await Promise.all([
      this.model.findMany({
        where,
        skip,
        take,
        orderBy: this.getDefaultOrderBy(),
        ...(this.config.selectFields && { select: this.config.selectFields }),
        ...(this.config.include && { include: this.config.include }),
      }),
      this.model.count({ where }),
    ]);

    return buildOffsetPaginationResponse(items, total, page, limit);
  }

  /**
   * Find a single record by ID
   */
  async findById(id: string, orgId?: string): Promise<T> {
    const where: any = { id };
    
    if (orgId) {
      where.org_id = orgId;
    }

    const record = await this.model.findUnique({
      where: { id },
      ...(this.config.include && { include: this.config.include }),
    });

    if (!record) {
      throw ApiError.notFound(`${this.modelName} not found`);
    }

    // Verify organization ownership if orgId provided
    if (orgId && record.org_id && record.org_id !== orgId) {
      throw ApiError.notFound(`${this.modelName} not found`);
    }

    return record;
  }

  /**
   * Update a record
   */
  async update(id: string, data: Partial<T>, orgId?: string, request?: any): Promise<T> {
    // Verify record exists and belongs to org
    await this.findById(id, orgId);

    try {
      const record = await this.model.update({
        where: { id },
        data: this.beforeUpdate(data),
        ...(this.config.include && { include: this.config.include }),
      });

      if (this.config.auditLogging && record.org_id) {
        await AuditLogger.logSuccess(
          record.org_id,
          request?.user?.email || 'system',
          `${this.modelName}.update`,
          this.getRecordLabel(record),
          record.id,
          data,
          request
        );
      }

      return record;
    } catch (error: any) {
      if (this.config.auditLogging && orgId) {
        await AuditLogger.logFailure(
          orgId,
          request?.user?.email || 'unknown',
          `${this.modelName}.update`,
          id,
          id,
          { error: error.message },
          request
        );
      }

      this.handlePrismaError(error);
      throw error;
    }
  }

  /**
   * Delete a record (soft or hard delete)
   */
  async delete(id: string, orgId?: string, request?: any): Promise<void> {
    const record = await this.findById(id, orgId);

    try {
      if (this.config.softDeleteField) {
        // Soft delete
        await this.model.update({
          where: { id },
          data: { [this.config.softDeleteField]: new Date() },
        });
      } else {
        // Hard delete
        await this.model.delete({ where: { id } });
      }

      if (this.config.auditLogging && record.org_id) {
        await AuditLogger.logSuccess(
          record.org_id,
          request?.user?.email || 'system',
          `${this.modelName}.delete`,
          this.getRecordLabel(record),
          record.id,
          {},
          request
        );
      }
    } catch (error: any) {
      if (this.config.auditLogging && orgId) {
        await AuditLogger.logFailure(
          orgId,
          request?.user?.email || 'unknown',
          `${this.modelName}.delete`,
          id,
          id,
          { error: error.message },
          request
        );
      }

      this.handlePrismaError(error);
      throw error;
    }
  }

  /**
   * Hook: Transform data before create
   */
  protected beforeCreate(data: Partial<T>, _request?: any): Partial<T> {
    return data;
  }

  /**
   * Hook: Transform data before update
   */
  protected beforeUpdate(data: Partial<T>): Partial<T> {
    return data;
  }

  /**
   * Hook: Get record label for audit logs
   */
  protected getRecordLabel(record: any): string {
    return record.name || record.title || record.id;
  }

  /**
   * Hook: Default order by clause
   */
  protected getDefaultOrderBy(): any {
    return { created_at: 'desc' };
  }

  /**
   * Build where clause for filtering
   */
  protected buildWhereClause(orgId: string | undefined, filters: FindAllFilters): any {
    const where: any = {};

    if (orgId) {
      where.org_id = orgId;
    }

    // Soft delete filter
    if (this.config.softDeleteField) {
      where[this.config.softDeleteField] = null;
    }

    // Status filter
    if (filters.status) {
      where.status = filters.status;
    }

    // Search filter
    if (filters.search && this.config.searchableFields) {
      where.OR = this.config.searchableFields.map((field) => ({
        [field]: { contains: filters.search, mode: 'insensitive' },
      }));
    }

    // Additional filters
    Object.keys(filters).forEach((key) => {
      if (key !== 'search' && key !== 'status' && filters[key] !== undefined) {
        where[key] = filters[key];
      }
    });

    return where;
  }

  /**
   * Handle Prisma errors and convert to ApiError
   */
  protected handlePrismaError(error: any): void {
    if (error.code === 'P2002') {
      // Unique constraint violation
      const field = error.meta?.target?.[0] || 'field';
      throw ApiError.conflict(`${this.modelName} with this ${field} already exists`);
    }
    
    if (error.code === 'P2003') {
      // Foreign key constraint violation
      throw ApiError.badRequest('Invalid reference to related record');
    }

    if (error.code === 'P2025') {
      // Record not found
      throw ApiError.notFound(`${this.modelName} not found`);
    }
  }
}
