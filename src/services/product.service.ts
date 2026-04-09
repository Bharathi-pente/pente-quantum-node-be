import prisma from '../config/database';
import ApiError from '../utils/ApiError';
import { AuditLogger } from '../utils/audit-logger';
import { BaseService } from './base/BaseService';
import { buildOffsetPaginationResponse } from '../utils/pagination';
import { products, Prisma } from '@prisma/client';
import { getBillingClient } from '../integrations/billing.client';
import logger from '../config/logger';

export class ProductService extends BaseService<products> {
  constructor() {
    super('products', prisma.products, {
      auditLogging: true,
      searchableFields: ['name', 'description'],
      include: {
        product_features: {
          include: {
            features: {
              select: {
                name: true,
                category: true,
              },
            },
          },
        },
        _count: {
          select: {
            customers: true,
          },
        },
      },
    });
  }

  /**
   * Override beforeCreate to set defaults
   */
  protected beforeCreate(data: Partial<products>): Partial<products> {
    return {
      ...data,
      status: data.status || 'active',
      base_price: data.base_price || new Prisma.Decimal(0),
    };
  }

  /**
   * Override beforeUpdate to validate and transform fields
   */
  protected beforeUpdate(data: Partial<products>): Partial<products> {
    const allowedFields = ['name', 'description', 'base_price', 'status', 'plan_code', 'interval', 'pay_in_advance', 'amount_cents', 'amount_currency', 'plan_description'];
    const filteredData: any = {};
    
    allowedFields.forEach(field => {
      if ((data as any)[field] !== undefined) {
        if (field === 'name' && (data as any)[field]) {
          filteredData[field] = (data as any)[field].trim();
        } else if (field === 'base_price') {
          filteredData[field] = Number((data as any)[field]);
        } else {
          filteredData[field] = (data as any)[field];
        }
      }
    });

    if (Object.keys(filteredData).length === 0) {
      throw ApiError.badRequest('No valid fields provided for update');
    }

    return filteredData;
  }

  /**
   * Override create to follow meters pattern - user-specific ownership
   */
  async create(data: Partial<products>, request?: any): Promise<products> {
    // Check for duplicate product name for this user
    const existingProduct = await prisma.products.findFirst({
      where: {
        created_by: request?.user?.id,
        name: data.name,
      },
    });

    if (existingProduct) {
      throw ApiError.conflict('Product with this name already exists for your account');
    }

    try {
      const record = await this.model.create({
        data: {
          ...data,
          org_id: data.org_id || request?.user?.orgId || null, // Use user's org_id if not provided
          status: data.status || 'active',
          created_by: request?.user?.id,
          base_price: data.base_price || new Prisma.Decimal(0),
        },
      });

      if (this.config.auditLogging && data.org_id) {
        await AuditLogger.logSuccess(
          data.org_id,
          request?.user?.email || 'system',
          'products.create',
          record.name,
          record.id,
          data,
          request
        );
      }

      // Sync plan to billing service if plan fields are provided
      if (data.plan_code && data.interval && data.amount_cents !== undefined) {
        // Fire-and-recover pattern: sync to billing service after commit
        this.syncPlanToBilling(record).catch((err) => {
          logger.error('Failed to sync plan to billing service', {
            product_id: record.id,
            error: err.message,
          });
        });
      }

      return record;
    } catch (error: any) {
      if (error.code === 'P2003') {
        throw ApiError.badRequest('Invalid organization ID');
      }
      throw error;
    }
  }

  /**
   * Override findAll to filter by org_id (follows pricing models pattern)
   */
  async findAll(
    orgId: string,
    page = 1,
    limit = 10,
    filters: any = {}
  ): Promise<any> {
    const skip = (page - 1) * limit;
    const where: any = { org_id: orgId };

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.search && this.config.searchableFields) {
      where.OR = this.config.searchableFields.map((field: string) => ({
        [field]: { contains: filters.search, mode: 'insensitive' }
      }));
    }

    const [items, total] = await Promise.all([
      this.model.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        ...(this.config.selectFields && { select: this.config.selectFields }),
        ...(this.config.include && { include: this.config.include }),
      }),
      this.model.count({ where }),
    ]);

    return buildOffsetPaginationResponse(items, total, page, limit);
  }

  /**
   * Override findById to filter by org_id (follows pricing models pattern)
   */
  async findById(id: string, orgId: string): Promise<products> {
    const record = await this.model.findFirst({
      where: {
        id,
        org_id: orgId,
      },
      ...(this.config.include && { include: this.config.include }),
    });

    if (!record) {
      throw ApiError.notFound('Product not found');
    }

    return record;
  }

  /**
   * Override update to filter by org_id (follows pricing models pattern)
   */
  async update(id: string, data: Partial<products>, orgId: string, userId: string, request?: any): Promise<products> {
    // Check if record exists and belongs to org
    await this.findById(id, orgId);

    // Check for name conflict if name is being updated
    if (data.name) {
      const existingProduct = await prisma.products.findFirst({
        where: {
          org_id: orgId,
          name: data.name,
          id: { not: id },
        },
      });

      if (existingProduct) {
        throw ApiError.conflict('Product with this name already exists for this organization');
      }
    }

    try {
      const record = await this.model.update({
        where: { id },
        data: this.beforeUpdate(data),
        ...(this.config.include && { include: this.config.include }),
      });

      if (this.config.auditLogging && record.org_id) {
        await AuditLogger.logSuccess(
          record.org_id,
          request?.user?.email || userId,
          'products.update',
          record.name,
          record.id,
          data,
          request
        );
      }

      return record;
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw ApiError.notFound('Product not found');
      }
      throw error;
    }
  }

  /**
   * Override delete to check for customers (follows pricing models pattern)
   */
  async delete(id: string, orgId: string, _request?: any): Promise<void> {
    // Check if record exists and belongs to org
    await this.findById(id, orgId);

    // Check if any customers are using this product
    const customerCount = await prisma.customers.count({
      where: { product_id: id },
    });

    if (customerCount > 0) {
      throw ApiError.conflict(
        `Cannot delete product with ${customerCount} active customers. Archive it instead.`
      );
    }

    try {
      await this.model.delete({
        where: { id },
      });

      // if (this.config.auditLogging && orgId) {
      //   await AuditLogger.logSuccess(
      //     orgId,
      //     _request?.user?.email || 'system',
      //     'products.delete',
      //     id,
      //     id,
      //     {},
      //     _request
      //   );
      // }
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw ApiError.notFound('Product not found');
      }
      throw error;
    }
  }

  async addFeature(productId: string, featureId: string) {
    const feature = await prisma.features.findUnique({
      where: { id: featureId },
    });

    if (!feature) {
      throw ApiError.notFound('Feature not found');
    }

    const existing = await prisma.product_features.findFirst({
      where: {
        product_id: productId,
        feature_id: featureId,
      },
    });

    if (existing) {
      throw ApiError.conflict('Feature already added to this product');
    }

    return await prisma.product_features.create({
      data: {
        product_id: productId,
        feature_id: featureId,
      },
      include: {
        features: true,
      },
    });
  }

  async removeFeature(productId: string, featureId: string) {
    const productFeature = await prisma.product_features.findFirst({
      where: {
        product_id: productId,
        feature_id: featureId,
      },
    });

    if (!productFeature) {
      throw ApiError.notFound('Feature not found in product');
    }

    return await prisma.product_features.delete({
      where: { id: productFeature.id },
    });
  }

  private async syncPlanToBilling(product: products): Promise<void> {
    const billing = getBillingClient();

    try {
      logger.info('Syncing plan to billing service', {
        product_id: product.id,
        product_name: product.name,
        plan_code: product.plan_code,
      });

      const result = await billing.createPlan({
        internal_id: product.id,
        name: product.name,
        code: product.plan_code!,
        interval: product.interval!,
        pay_in_advance: product.pay_in_advance!,
        amount_cents: product.amount_cents!,
        amount_currency: product.amount_currency || 'USD',
        description: product.plan_description || product.description,
      });

      if (result.success) {
        logger.info('Plan synced to billing service successfully', {
          product_id: product.id,
          plan_code: product.plan_code,
        });
      } else {
        logger.error('Billing service returned failure for plan creation', {
          product_id: product.id,
          error: result.error,
        });
      }
    } catch (error) {
      logger.error('Failed to sync plan to billing service', {
        product_id: product.id,
        error: error.message,
      });
      throw error; // Re-throw to be caught by the fire-and-recover pattern
    }
  }
}

export default new ProductService();
