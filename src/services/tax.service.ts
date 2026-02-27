import prisma from '../config/database';
import ApiError from '../utils/ApiError';

export interface CreateTaxConfigInput {
  enabled?: boolean;
  default_rate?: number;
}

export interface UpdateTaxConfigInput {
  enabled?: boolean;
  default_rate?: number;
}

export class TaxService {
  /**
   * Get tax config for organization
   */
  static async getTaxConfig(orgId: string) {
    const taxConfig = await prisma.tax_configs.findUnique({
      where: { org_id: orgId }
    });

    if (!taxConfig) {
      // Return default config if not exists
      return {
        id: '',
        enabled: false,
        default_rate: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    return {
      id: taxConfig.id,
      enabled: taxConfig.enabled,
      default_rate: taxConfig.default_rate ? Number(taxConfig.default_rate) : 0,
      created_at: taxConfig.created_at.toISOString(),
      updated_at: taxConfig.updated_at.toISOString()
    };
  }

  /**
   * Create or update tax config for organization
   */
  static async upsertTaxConfig(data: CreateTaxConfigInput, orgId: string) {
    const taxConfig = await prisma.tax_configs.upsert({
      where: { org_id: orgId },
      update: {
        enabled: data.enabled,
        default_rate: data.default_rate
      },
      create: {
        org_id: orgId,
        enabled: data.enabled ?? false,
        default_rate: data.default_rate ?? 0
      }
    });

    return {
      id: taxConfig.id,
      enabled: taxConfig.enabled,
      default_rate: taxConfig.default_rate ? Number(taxConfig.default_rate) : 0,
      created_at: taxConfig.created_at.toISOString(),
      updated_at: taxConfig.updated_at.toISOString()
    };
  }

  /**
   * Update tax config
   */
  static async updateTaxConfig(data: UpdateTaxConfigInput, orgId: string) {
    const existingConfig = await prisma.tax_configs.findUnique({
      where: { org_id: orgId }
    });

    if (!existingConfig) {
      throw new ApiError(404, 'Tax configuration not found');
    }

    const taxConfig = await prisma.tax_configs.update({
      where: { org_id: orgId },
      data: {
        enabled: data.enabled,
        default_rate: data.default_rate
      }
    });

    return {
      id: taxConfig.id,
      enabled: taxConfig.enabled,
      default_rate: taxConfig.default_rate ? Number(taxConfig.default_rate) : 0,
      created_at: taxConfig.created_at.toISOString(),
      updated_at: taxConfig.updated_at.toISOString()
    };
  }
}