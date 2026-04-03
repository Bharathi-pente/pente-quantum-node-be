import prisma from '../config/database';
import ApiError from '../utils/ApiError';
import { CreateCreditInput, UpdateCreditInput, GetCreditsInput } from '../validators/credit.validator';

export class CreditService {
  /**
   * Create a new credit for a customer
   */
  static async createCredit(data: CreateCreditInput['body'], orgId: string, _userId: string) {
    try {
      // Build customer filter - always check customer exists, filter by org if provided
      const customerWhere: any = { id: data.customer_id };
      if (orgId) {
        customerWhere.org_id = orgId;
      }

      const customer = await prisma.customers.findFirst({
        where: customerWhere,
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
        }
      });

      if (!customer) {
        if (orgId) {
          throw new ApiError(404, 'Customer not found or does not belong to your organization');
        } else {
          throw new ApiError(404, 'Customer not found');
        }
      }

      // Set remaining amount to original amount if not provided
      const remainingAmount = data.remaining_amount ?? data.original_amount;

      const credit = await prisma.credits.create({
        data: {
          customer_id: data.customer_id,
          credit_type: data.credit_type,
          original_amount: data.original_amount,
          remaining_amount: remainingAmount,
          used_amount: data.used_amount,
          expires_at: data.expires_at ? new Date(data.expires_at) : null,
          priority: data.priority,
          applicable_to: data.applicable_to,
          status: data.status,
          reason: data.reason
        },
        include: {
          customers: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          credit_ledger: {
            orderBy: {
              created_at: 'desc'
            },
            take: 5
          }
        }
      });

      // Create initial ledger entry
      await prisma.credit_ledger.create({
        data: {
          customer_id: data.customer_id,
          credit_id: credit.id,
          entry_date: new Date(),
          txn_type: 'grant',
          amount: data.original_amount,
          running_balance: remainingAmount,
          description: `Initial credit: ${data.reason || 'Credit added'}`
        }
      });

      return credit;
    } catch (error: any) {
      if (error?.code === 'P2003') {
        throw new ApiError(400, 'Invalid customer ID');
      }
      throw error;
    }
  }

  /**
   * Get all credits with pagination and filtering
   */
  static async getCredits(query: GetCreditsInput['query'], orgId: string) {
    try {
      const { page = 1, limit = 10, customer_id, status, credit_type } = query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};

      if (orgId) {
        where.customers = {
          org_id: orgId
        };
      }

      if (customer_id) {
        where.customer_id = customer_id;
      }

      if (status) {
        where.status = status;
      }

      if (credit_type) {
        where.credit_type = credit_type;
      }

      const [credits, total] = await Promise.all([
        prisma.credits.findMany({
          where,
          include: {
            customers: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            created_at: 'desc'
          },
          skip,
          take: Number(limit)
        }),
        prisma.credits.count({ where })
      ]);

      return {
        credits,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get credit by ID
   */
  static async getCreditById(id: string, orgId: string) {
    try {
      const credit = await prisma.credits.findFirst({
        where: {
          id,
          customers: {
            org_id: orgId
          }
        },
        include: {
          customers: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          credit_ledger: {
            orderBy: {
              created_at: 'desc'
            }
          }
        }
      });

      if (!credit) {
        throw new ApiError(404, 'Credit not found or does not belong to your organization');
      }

      return credit;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update credit
   */
  static async updateCredit(id: string, data: UpdateCreditInput['body'], orgId: string, _userId: string) {
    try {
      // Check if credit exists and belongs to organization
      const existingCredit = await prisma.credits.findFirst({
        where: {
          id,
          customers: {
            org_id: orgId
          }
        }
      });

      if (!existingCredit) {
        throw new ApiError(404, 'Credit not found or does not belong to your organization');
      }

      const updateData: any = {};

      if (data.credit_type !== undefined) updateData.credit_type = data.credit_type;
      if (data.original_amount !== undefined) updateData.original_amount = data.original_amount;
      if (data.remaining_amount !== undefined) updateData.remaining_amount = data.remaining_amount;
      if (data.used_amount !== undefined) updateData.used_amount = data.used_amount;
      if (data.expires_at !== undefined) updateData.expires_at = data.expires_at ? new Date(data.expires_at) : null;
      if (data.priority !== undefined) updateData.priority = data.priority;
      if (data.applicable_to !== undefined) updateData.applicable_to = data.applicable_to;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.reason !== undefined) updateData.reason = data.reason;

      const credit = await prisma.credits.update({
        where: { id },
        data: updateData,
        include: {
          customers: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      return credit;
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new ApiError(404, 'Credit not found');
      }
      throw error;
    }
  }

  /**
   * Delete credit
   */
  static async deleteCredit(id: string, orgId: string) {
    try {
      // Check if credit exists and belongs to organization
      const existingCredit = await prisma.credits.findFirst({
        where: {
          id,
          customers: {
            org_id: orgId
          }
        }
      });

      if (!existingCredit) {
        throw new ApiError(404, 'Credit not found or does not belong to your organization');
      }

      // Check if credit has been used
      if (Number(existingCredit.used_amount) > 0) {
        throw new ApiError(400, 'Cannot delete credit that has been used');
      }

      await prisma.credits.delete({
        where: { id }
      });

      return { message: 'Credit deleted successfully' };
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (error?.code === 'P2025') {
        throw new ApiError(404, 'Credit not found');
      }
      throw error;
    }
  }

  /**
   * Apply credit to an invoice or payment
   */
  static async applyCredit(creditId: string, amount: number, description: string, orgId: string, _userId: string) {
    try {
      return await prisma.$transaction(async (tx: any) => {
        // Get credit
        const credit = await tx.credits.findFirst({
          where: {
            id: creditId,
            customers: {
              org_id: orgId
            }
          }
        });

        if (!credit) {
          throw new ApiError(404, 'Credit not found or does not belong to your organization');
        }

        if (credit.status !== 'active') {
          throw new ApiError(400, 'Credit is not active');
        }

        if (Number(credit.remaining_amount) < amount) {
          throw new ApiError(400, 'Insufficient credit balance');
        }

        // Update credit
        const currentRemaining = Number(credit.remaining_amount);
        const currentUsed = Number(credit.used_amount || 0);
        const newRemainingAmount = currentRemaining - amount;
        const newUsedAmount = currentUsed + amount;
        const newStatus = newRemainingAmount === 0 ? 'used' : 'active';

        await tx.credits.update({
          where: { id: creditId },
          data: {
            remaining_amount: newRemainingAmount,
            used_amount: newUsedAmount,
            status: newStatus
          }
        });

        // Create ledger entry
        await tx.credit_ledger.create({
          data: {
            customer_id: credit.customer_id,
            credit_id: creditId,
            entry_date: new Date(),
            txn_type: 'usage',
            amount: -amount,
            running_balance: newRemainingAmount,
            description
          }
        });

        return {
          credit_id: creditId,
          applied_amount: amount,
          remaining_balance: newRemainingAmount
        };
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'Failed to apply credit');
    }
  }

  /**
   * Get credit ledger entries
   */
  static async getCreditLedger(creditId: string, query: { page?: number; limit?: number }, orgId: string) {
    try {
      const { page = 1, limit = 10 } = query;
      const skip = (page - 1) * limit;

      // Verify credit belongs to organization
      const credit = await prisma.credits.findFirst({
        where: {
          id: creditId,
          customers: {
            org_id: orgId
          }
        }
      });

      if (!credit) {
        throw new ApiError(404, 'Credit not found or does not belong to your organization');
      }

      const [entries, total] = await Promise.all([
        prisma.credit_ledger.findMany({
          where: {
            credit_id: creditId
          },
          orderBy: {
            created_at: 'desc'
          },
          skip,
          take: limit
        }),
        prisma.credit_ledger.count({
          where: {
            credit_id: creditId
          }
        })
      ]);

      return {
        credit_id: creditId,
        entries,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get customer credit summary
   */
  static async getCustomerCreditSummary(customerId: string, orgId: string) {
    try {
      // Verify customer belongs to organization
      const customer = await prisma.customers.findFirst({
        where: {
          id: customerId,
          org_id: orgId
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
        }
      });

      if (!customer) {
        throw new ApiError(404, 'Customer not found or does not belong to your organization');
      }

      const credits = await prisma.credits.findMany({
        where: {
          customer_id: customerId,
          status: 'active'
        },
        select: {
          id: true,
          credit_type: true,
          original_amount: true,
          remaining_amount: true,
          expires_at: true,
          priority: true
        },
        orderBy: {
          priority: 'desc'
        }
      });

      const totalAvailable = credits.reduce((sum: number, credit: any) => sum + Number(credit.remaining_amount), 0);
      const totalOriginal = credits.reduce((sum: number, credit: any) => sum + Number(credit.original_amount), 0);

      return {
        customer_id: customerId,
        total_available: totalAvailable,
        total_original: totalOriginal,
        active_credits: credits.length,
        credits
      };
    } catch (error) {
      throw error;
    }
  }
}