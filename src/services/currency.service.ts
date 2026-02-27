import prisma from '../config/database';
import ApiError from '../utils/ApiError';
import { CreateCurrencyConfigInput, UpdateCurrencyConfigInput } from '../validators/currency.validator';

export class CurrencyService {
  /**
   * Get currency configuration for organization
   */
  static async getCurrencyConfig(orgId: string) {
    const config = await prisma.currency_configs.findFirst({
      where: { org_id: orgId }
    });

    if (!config) {
      // Return default config if none exists
      return {
        base_currency: 'USD',
        supported_currencies: ['USD', 'EUR', 'GBP'],
        exchange_rates: {},
        auto_update_rates: false,
        last_updated: null
      };
    }

    return {
      id: config.id,
      base_currency: config.base_currency,
      supported_currencies: config.supported_currencies,
      exchange_rates: config.exchange_rates || {},
      auto_update_rates: config.auto_update_rates,
      last_updated: config.last_updated?.toISOString(),
      created_at: config.created_at.toISOString(),
      updated_at: config.updated_at.toISOString()
    };
  }

  /**
   * Create currency configuration
   */
  static async createCurrencyConfig(data: CreateCurrencyConfigInput, orgId: string) {
    // Check if config already exists
    const existing = await prisma.currency_configs.findFirst({
      where: { org_id: orgId }
    });

    if (existing) {
      throw new ApiError(400, 'Currency configuration already exists for this organization');
    }

    const config = await prisma.currency_configs.create({
      data: {
        org_id: orgId,
        base_currency: data.base_currency,
        supported_currencies: data.supported_currencies || ['USD', 'EUR', 'GBP'],
        exchange_rates: data.exchange_rates || {},
        auto_update_rates: data.auto_update_rates || false,
        last_updated: new Date()
      }
    });

    return {
      id: config.id,
      base_currency: config.base_currency,
      supported_currencies: config.supported_currencies,
      exchange_rates: config.exchange_rates || {},
      auto_update_rates: config.auto_update_rates,
      last_updated: config.last_updated?.toISOString(),
      created_at: config.created_at.toISOString(),
      updated_at: config.updated_at.toISOString()
    };
  }

  /**
   * Update currency configuration
   */
  static async updateCurrencyConfig(data: UpdateCurrencyConfigInput, orgId: string) {
    const existing = await prisma.currency_configs.findFirst({
      where: { org_id: orgId }
    });

    if (!existing) {
      throw new ApiError(404, 'Currency configuration not found');
    }

    const updateData: any = {
      updated_at: new Date()
    };

    if (data.base_currency !== undefined) {
      updateData.base_currency = data.base_currency;
    }

    if (data.supported_currencies !== undefined) {
      updateData.supported_currencies = data.supported_currencies;
    }

    if (data.exchange_rates !== undefined) {
      updateData.exchange_rates = data.exchange_rates;
      updateData.last_updated = new Date();
    }

    if (data.auto_update_rates !== undefined) {
      updateData.auto_update_rates = data.auto_update_rates;
    }

    const config = await prisma.currency_configs.update({
      where: { id: existing.id },
      data: updateData
    });

    return {
      id: config.id,
      base_currency: config.base_currency,
      supported_currencies: config.supported_currencies,
      exchange_rates: config.exchange_rates || {},
      auto_update_rates: config.auto_update_rates,
      last_updated: config.last_updated?.toISOString(),
      created_at: config.created_at.toISOString(),
      updated_at: config.updated_at.toISOString()
    };
  }

  /**
   * Refresh exchange rates
   * In a real implementation, this would fetch from an external API
   */
  static async refreshExchangeRates(orgId: string) {
    const existing = await prisma.currency_configs.findFirst({
      where: { org_id: orgId }
    });

    if (!existing) {
      throw new ApiError(404, 'Currency configuration not found');
    }

    // Mock exchange rates - in production, fetch from API like exchangerate-api.com
    const mockRates: Record<string, number> = {
      EUR: 0.92,
      GBP: 0.79,
      CAD: 1.36,
      AUD: 1.53,
      JPY: 149.50,
      INR: 83.12,
      CNY: 7.24
    };

    const config = await prisma.currency_configs.update({
      where: { id: existing.id },
      data: {
        exchange_rates: mockRates,
        last_updated: new Date(),
        updated_at: new Date()
      }
    });

    return {
      id: config.id,
      base_currency: config.base_currency,
      supported_currencies: config.supported_currencies,
      exchange_rates: config.exchange_rates || {},
      auto_update_rates: config.auto_update_rates,
      last_updated: config.last_updated?.toISOString(),
      created_at: config.created_at.toISOString(),
      updated_at: config.updated_at.toISOString()
    };
  }
}
