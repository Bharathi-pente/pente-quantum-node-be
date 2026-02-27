import prisma from '../config/database';
import ApiError from '../utils/ApiError';
import { CreateTaxRegionInput, UpdateTaxRegionInput, GetTaxRegionsInput } from '../validators/taxRegion.validator';

export class TaxRegionService {
  /**
   * Get all tax regions for organization
   */
  static async getTaxRegions(orgId: string, filters: GetTaxRegionsInput = {}) {
    const where: any = { org_id: orgId };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.country_code) {
      where.country_code = filters.country_code;
    }

    const regions = await prisma.tax_regions.findMany({
      where,
      orderBy: { created_at: 'desc' }
    });

    return regions.map(region => ({
      id: region.id,
      country_code: region.country_code,
      state_code: region.state_code,
      rate: Number(region.rate),
      name: region.name,
      tax_type: region.tax_type,
      status: region.status,
      created_at: region.created_at.toISOString()
    }));
  }

  /**
   * Get tax region by ID
   */
  static async getTaxRegionById(id: string, orgId: string) {
    const region = await prisma.tax_regions.findFirst({
      where: {
        id,
        org_id: orgId
      }
    });

    if (!region) {
      throw new ApiError(404, 'Tax region not found');
    }

    return {
      id: region.id,
      country_code: region.country_code,
      state_code: region.state_code,
      rate: Number(region.rate),
      name: region.name,
      tax_type: region.tax_type,
      status: region.status,
      created_at: region.created_at.toISOString()
    };
  }

  /**
   * Create a new tax region
   */
  static async createTaxRegion(data: CreateTaxRegionInput, orgId: string) {
    const region = await prisma.tax_regions.create({
      data: {
        org_id: orgId,
        country_code: data.country_code,
        state_code: data.state_code,
        rate: data.rate,
        name: data.name,
        tax_type: data.tax_type,
        status: data.status
      }
    });

    return {
      id: region.id,
      country_code: region.country_code,
      state_code: region.state_code,
      rate: Number(region.rate),
      name: region.name,
      tax_type: region.tax_type,
      status: region.status,
      created_at: region.created_at.toISOString()
    };
  }

  /**
   * Update tax region
   */
  static async updateTaxRegion(id: string, data: UpdateTaxRegionInput, orgId: string) {
    const existingRegion = await prisma.tax_regions.findFirst({
      where: {
        id,
        org_id: orgId
      }
    });

    if (!existingRegion) {
      throw new ApiError(404, 'Tax region not found');
    }

    const region = await prisma.tax_regions.update({
      where: { id },
      data: {
        country_code: data.country_code,
        state_code: data.state_code,
        rate: data.rate,
        name: data.name,
        tax_type: data.tax_type,
        status: data.status
      }
    });

    return {
      id: region.id,
      country_code: region.country_code,
      state_code: region.state_code,
      rate: Number(region.rate),
      name: region.name,
      tax_type: region.tax_type,
      status: region.status,
      created_at: region.created_at.toISOString()
    };
  }

  /**
   * Delete tax region
   */
  static async deleteTaxRegion(id: string, orgId: string) {
    const existingRegion = await prisma.tax_regions.findFirst({
      where: {
        id,
        org_id: orgId
      }
    });

    if (!existingRegion) {
      throw new ApiError(404, 'Tax region not found');
    }

    await prisma.tax_regions.delete({
      where: { id }
    });

    return { message: 'Tax region deleted successfully' };
  }
}