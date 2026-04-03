import prisma from '../config/database';
import ApiError from '../utils/ApiError';

export class ContractService {
  async create(data: any) {
    // Verify customer exists and belongs to the organization
    const customer = await prisma.customers.findFirst({
      where: {
        id: data.customer_id,
        org_id: data.org_id, // We'll pass org_id from controller
      },
      select: {
        id: true,
        org_id: true,
        name: true,
        email: true,
        product_id: true,
        status: true,
        mrr: true,
        credit_balance: true,
        health_score: true,
        logo_initials: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!customer) {
      throw ApiError.notFound('Customer not found or does not belong to your organization');
    }

    // Verify rate card exists if provided (checks pricing_models since frontend sends pricing model IDs)
    if (data.rate_card_id) {
      const pricingModel = await prisma.pricing_models.findUnique({
        where: { id: data.rate_card_id },
      });
      if (!pricingModel) {
        throw ApiError.notFound('Rate card not found');
      }
    }

    try {
      return await prisma.contracts.create({
        data: {
          customer_id: data.customer_id,
          name: data.name,
          status: data.status || 'active',
          contract_type: data.contract_type,
          start_date: new Date(data.start_date),
          end_date: data.end_date ? new Date(data.end_date) : null,
          total_value: data.total_value || 0,
          commit_amount: data.commit_amount || 0,
          used_amount: data.used_amount || 0,
          remaining_amount: data.remaining_amount || 0,
          // rate_card_id: data.rate_card_id || null, // Temporarily disabled due to schema mismatch
          auto_renew: data.auto_renew || false,
          payment_terms: data.payment_terms || 'Net 30',
          amendment_count: data.amendment_count || 0,
        },
        include: {
          customers: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          rate_cards: false, // Explicitly exclude to return null
        },
      });
    } catch (error: any) {
      if (error.code === 'P2003') {
        // Foreign key constraint violation
        throw ApiError.badRequest('Invalid customer or rate card ID');
      }
      throw error;
    }
  }

  async findAll(orgId: string, page = 1, limit = 10, filters?: any) {
    const skip = (page - 1) * limit;
    const where: any = {};

    // Only filter by org_id if user is not a super admin (orgId is not null)
    if (orgId !== null) {
      where.customers = {
        org_id: orgId,
      };
    }

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.contract_type) {
      where.contract_type = filters.contract_type;
    }
    if (filters?.customer_id) {
      where.customer_id = filters.customer_id;
    }
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { customers: { name: { contains: filters.search, mode: 'insensitive' } } },
        { customers: { email: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    // Use transaction to reduce connection usage
    const result = await prisma.$transaction(async (tx) => {
      const [contracts, totalResult] = await Promise.all([
        tx.contracts.findMany({
          where,
          skip,
          take: limit,
          orderBy: { created_at: 'desc' },
          include: {
            customers: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            rate_cards: false, // Explicitly exclude to return null
          },
        }),
        tx.contracts.count({
          where: where,
        }),
      ]);

      return { contracts, total: totalResult };
    });

    return {
      data: result.contracts,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
        hasNextPage: page < Math.ceil(result.total / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  async findById(id: string, orgId: string) {
    const where: any = { id };

    // Only filter by org_id if user is not a super admin (orgId is not null)
    if (orgId !== null) {
      where.customers = {
        org_id: orgId,
      };
    }

    const contract = await prisma.contracts.findFirst({
      where,
      include: {
        customers: {
          select: {
            id: true,
            name: true,
            email: true,
            org_id: true,
          },
        },
        rate_cards: false, // Explicitly exclude to return null
      },
    });

    if (!contract) {
      throw ApiError.notFound('Contract not found or does not belong to your organization');
    }

    return contract;
  }

  async update(id: string, orgId: string, data: any) {
    // First verify the contract exists and belongs to the org
    await this.findById(id, orgId);

    // Verify rate card exists if provided (checks pricing_models since frontend sends pricing model IDs)
    if (data.rate_card_id) {
      const pricingModel = await prisma.pricing_models.findUnique({
        where: { id: data.rate_card_id },
      });
      if (!pricingModel) {
        throw ApiError.notFound('Rate card not found');
      }
    }

    try {
      return await prisma.contracts.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.status && { status: data.status }),
          ...(data.contract_type && { contract_type: data.contract_type }),
          ...(data.start_date && { start_date: new Date(data.start_date) }),
          ...(data.end_date !== undefined && { end_date: data.end_date ? new Date(data.end_date) : null }),
          ...(data.total_value !== undefined && { total_value: data.total_value }),
          ...(data.commit_amount !== undefined && { commit_amount: data.commit_amount }),
          ...(data.used_amount !== undefined && { used_amount: data.used_amount }),
          ...(data.remaining_amount !== undefined && { remaining_amount: data.remaining_amount }),
          // ...(data.rate_card_id !== undefined && { rate_card_id: data.rate_card_id }), // Disabled due to schema mismatch
          ...(data.auto_renew !== undefined && { auto_renew: data.auto_renew }),
          ...(data.payment_terms && { payment_terms: data.payment_terms }),
          ...(data.amendment_count !== undefined && { amendment_count: data.amendment_count }),
        },
        include: {
          customers: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          rate_cards: false, // Explicitly exclude to return null
        },
      });
    } catch (error: any) {
      if (error.code === 'P2003') {
        throw ApiError.badRequest('Invalid rate card ID');
      }
      throw error;
    }
  }

  async delete(id: string, orgId: string) {
    // First verify the contract exists and belongs to the org
    await this.findById(id, orgId);

    try {
      await prisma.contracts.delete({
        where: { id },
      });
      return { message: 'Contract deleted successfully' };
    } catch (error: any) {
      if (error.code === 'P2003') {
        throw ApiError.badRequest('Cannot delete contract with existing dependencies');
      }
      throw error;
    }
  }
}

export default new ContractService();