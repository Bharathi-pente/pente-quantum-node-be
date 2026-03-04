import prisma from '../config/database';
import ApiError from '../utils/ApiError';
import { CreateTaxExemptionInput, UpdateTaxExemptionInput, GetTaxExemptionsInput } from '../validators/taxExemption.validator';

export class TaxExemptionService {
  /**
   * Get all tax exemptions for organization
   */
  static async getTaxExemptions(orgId: string, filters: GetTaxExemptionsInput = {}) {
    const where: any = {};

    if (filters.customer_id) {
      where.customer_id = filters.customer_id;
    }

    // Get customers that belong to this organization
    const customers = await prisma.customers.findMany({
      where: { org_id: orgId },
      select: { id: true }
    });

    const customerIds = customers.map(c => c.id);
    where.customer_id = { in: customerIds };

    const exemptions = await prisma.tax_exemptions.findMany({
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
      orderBy: { created_at: 'desc' }
    });

    return exemptions.map(exemption => ({
      id: exemption.id,
      customer_id: exemption.customer_id,
      customer_name: exemption.customers.name,
      customer_email: exemption.customers.email,
      reason: exemption.reason,
      certificate_id: exemption.certificate_id,
      expires_at: exemption.expires_at?.toISOString(),
      created_at: exemption.created_at.toISOString(),
      status: exemption.expires_at && exemption.expires_at < new Date() ? 'expired' : 'active'
    }));
  }

  /**
   * Get tax exemption by ID
   */
  static async getTaxExemptionById(id: string, orgId: string) {
    // First check if the exemption belongs to a customer in this org
    const exemption = await prisma.tax_exemptions.findFirst({
      where: { id },
      include: {
        customers: {
          select: {
            id: true,
            name: true,
            email: true,
            org_id: true
          }
        }
      }
    });

    if (!exemption || exemption.customers.org_id !== orgId) {
      throw new ApiError(404, 'Tax exemption not found');
    }

    return {
      id: exemption.id,
      customer_id: exemption.customer_id,
      customer_name: exemption.customers.name,
      customer_email: exemption.customers.email,
      reason: exemption.reason,
      certificate_id: exemption.certificate_id,
      expires_at: exemption.expires_at?.toISOString(),
      created_at: exemption.created_at.toISOString(),
      status: exemption.expires_at && exemption.expires_at < new Date() ? 'expired' : 'active'
    };
  }

  /**
   * Create a new tax exemption
   */
  static async createTaxExemption(data: CreateTaxExemptionInput, orgId: string) {
    // Verify customer belongs to organization
    const customer = await prisma.customers.findFirst({
      where: {
        id: data.customer_id,
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

    const exemption = await prisma.tax_exemptions.create({
      data: {
        org_id: orgId,
        customer_id: data.customer_id,
        reason: data.reason,
        certificate_id: data.certificate_id,
        expires_at: data.expires_at ? new Date(data.expires_at) : null
      },
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

    return {
      id: exemption.id,
      customer_id: exemption.customer_id,
      customer_name: exemption.customers.name,
      customer_email: exemption.customers.email,
      reason: exemption.reason,
      certificate_id: exemption.certificate_id,
      expires_at: exemption.expires_at?.toISOString(),
      created_at: exemption.created_at.toISOString(),
      status: exemption.expires_at && exemption.expires_at < new Date() ? 'expired' : 'active'
    };
  }

  /**
   * Update tax exemption
   */
  static async updateTaxExemption(id: string, data: UpdateTaxExemptionInput, orgId: string) {
    // First check if the exemption belongs to a customer in this org
    const existingExemption = await prisma.tax_exemptions.findFirst({
      where: { id },
      include: {
        customers: {
          select: { org_id: true }
        }
      }
    });

    if (!existingExemption || existingExemption.customers.org_id !== orgId) {
      throw new ApiError(404, 'Tax exemption not found');
    }

    const exemption = await prisma.tax_exemptions.update({
      where: { id },
      data: {
        reason: data.reason,
        certificate_id: data.certificate_id,
        expires_at: data.expires_at ? new Date(data.expires_at) : null
      },
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

    return {
      id: exemption.id,
      customer_id: exemption.customer_id,
      customer_name: exemption.customers.name,
      customer_email: exemption.customers.email,
      reason: exemption.reason,
      certificate_id: exemption.certificate_id,
      expires_at: exemption.expires_at?.toISOString(),
      created_at: exemption.created_at.toISOString(),
      status: exemption.expires_at && exemption.expires_at < new Date() ? 'expired' : 'active'
    };
  }

  /**
   * Delete tax exemption
   */
  static async deleteTaxExemption(id: string, orgId: string) {
    // First check if the exemption belongs to a customer in this org
    const existingExemption = await prisma.tax_exemptions.findFirst({
      where: { id },
      include: {
        customers: {
          select: { org_id: true }
        }
      }
    });

    if (!existingExemption || existingExemption.customers.org_id !== orgId) {
      throw new ApiError(404, 'Tax exemption not found');
    }

    await prisma.tax_exemptions.delete({
      where: { id }
    });

    return { message: 'Tax exemption deleted successfully' };
  }
}