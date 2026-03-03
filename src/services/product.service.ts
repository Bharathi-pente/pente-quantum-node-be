import prisma from '../config/database';
import ApiError from '../utils/ApiError';

export class ProductService {
  async create(data: any) {
    try {
      return await prisma.products.create({
        data: {
          ...data,
          status: data.status || 'active',
          base_price: data.base_price || 0,
        },
        include: {
          product_features: {
            include: {
              features: true,
            },
          },
          _count: {
            select: {
              customers: true,
            },
          },
        },
      });
    } catch (error: any) {
      if (error.code === 'P2003') {
        // Foreign key constraint violation
        throw ApiError.badRequest('Invalid organization ID');
      }
      if (error.code === 'P2002') {
        // Unique constraint violation
        throw ApiError.conflict('Product with this name already exists in your organization');
      }
      throw error;
    }
  }

  async findAll(orgId: string | undefined, page = 1, limit = 10, filters?: any) {
    const skip = (page - 1) * limit;
    const where: any = orgId ? { org_id: orgId } : {};

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.products.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
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
      }),
      prisma.products.count({ where }),
    ]);

    return { products, total, page, limit };
  }

  async findById(id: string) {
    const product = await prisma.products.findUnique({
      where: { id },
    });

    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    return product;
  }

  async update(id: string, data: any) {

    // Filter to only include valid fields for products table
    const allowedFields = ['name', 'description', 'base_price', 'status'];
    const filteredData: any = {};
    
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        if (field === 'name' && data[field]) {
          filteredData[field] = data[field].trim();
        } else if (field === 'base_price') {
          filteredData[field] = Number(data[field]);
        } else {
          filteredData[field] = data[field];
        }
      }
    });

    console.log('Filtered data:', JSON.stringify(filteredData, null, 2));

    if (Object.keys(filteredData).length === 0) {
      throw ApiError.badRequest('No valid fields provided for update');
    }

    try {
      return await prisma.products.update({
        where: { id },
        data: filteredData,
        include: {
          product_features: {
            include: {
              features: true,
            },
          },
          _count: {
            select: {
              customers: true,
            },
          },
        },
      });
    } catch (error: any) {
      console.error('Prisma update error:', error);
      if (error.code === 'P2002') {
        // Unique constraint violation
        throw ApiError.conflict('Product with this name already exists in your organization');
      }
      throw error;
    }
  }

  async delete(id: string) {
    // Check if any customers are using this product
    const customerCount = await prisma.customers.count({
      where: { product_id: id },
    });

    if (customerCount > 0) {
      throw ApiError.conflict(
        `Cannot delete product with ${customerCount} active customers. Archive it instead.`
      );
    }

    return await prisma.products.delete({ where: { id } });
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
