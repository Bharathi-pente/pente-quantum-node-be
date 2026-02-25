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
    });

    if (!customer) {
      throw ApiError.notFound('Customer not found or does not belong to your organization');
    }

    // Verify rate card exists if provided
    if (data.rate_card_id) {
      const rateCard = await prisma.rate_cards.findUnique({
        where: { id: data.rate_card_id },
      });
      if (!rateCard) {
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
          rate_card_id: data.rate_card_id || null,
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
          rate_cards: {
            select: {
              id: true,
              name: true,
            },
          },
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
    const where: any = {
      customers: {
        org_id: orgId,
      },
    };

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

    const [contracts, total] = await Promise.all([
      prisma.contracts.findMany({
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
          rate_cards: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.contracts.count({
        where: {
          customers: {
            org_id: orgId,
          },
          ...where,
        },
      }),
    ]);

    return { contracts, total, page, limit };
  }

  async findById(id: string, orgId: string) {
    const contract = await prisma.contracts.findFirst({
      where: {
        id,
        customers: {
          org_id: orgId,
        },
      },
      include: {
        customers: {
          select: {
            id: true,
            name: true,
            email: true,
            org_id: true,
          },
        },
        rate_cards: {
          select: {
            id: true,
            name: true,
          },
        },
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

    // Verify rate card exists if provided
    if (data.rate_card_id) {
      const rateCard = await prisma.rate_cards.findUnique({
        where: { id: data.rate_card_id },
      });
      if (!rateCard) {
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
          ...(data.rate_card_id !== undefined && { rate_card_id: data.rate_card_id }),
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
          rate_cards: {
            select: {
              id: true,
              name: true,
            },
          },
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