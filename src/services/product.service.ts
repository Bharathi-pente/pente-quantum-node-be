import prisma from '../config/database';
import ApiError from '../utils/ApiError';
import { BaseService } from './base/BaseService';
import { products, Prisma } from '@prisma/client';

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
    const allowedFields = ['name', 'description', 'base_price', 'status'];
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
   * Override delete to check for customers
   */
  async delete(id: string, orgId?: string, request?: any): Promise<void> {
    // Check if any customers are using this product
    const customerCount = await prisma.customers.count({
      where: { product_id: id },
    });

    if (customerCount > 0) {
      throw ApiError.conflict(
        `Cannot delete product with ${customerCount} active customers. Archive it instead.`
      );
    }

    // Call parent delete
    await super.delete(id, orgId, request);
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
}

export default new ProductService();
