/**
 * Service Registration
 * 
 * Register all services with the DI container
 */

import { container, TYPES } from '../core/DIContainer';
import prisma from '../config/database';
import logger from '../config/logger';

// Import repositories
import { CustomerRepository } from '../repositories/implementations/CustomerRepository';

// Import services
import { CustomerService } from '../services/customer.service';
import { OrganizationService } from '../services/organization.service';
import { ProductService } from '../services/product.service';
import { InvoiceService } from '../services/invoice.service';
import { AuthService } from '../services/auth.service';
import { ContractService } from '../services/contract.service';
import { CreditService } from '../services/credit.service';
import { CurrencyService } from '../services/currency.service';
import { FeatureService } from '../services/feature.service';
import { MeterService } from '../services/meter.service';
import { PaymentService } from '../services/payment.service';
import { PricingModelService } from '../services/pricingModel.service';
import { RateLimitService } from '../services/rateLimit.service';
import { TaxService } from '../services/tax.service';
import { TaxExemptionService } from '../services/taxExemption.service';
import { TaxRegionService } from '../services/taxRegion.service';
import { UsageLimitService } from '../services/usageLimit.service';
import { UserService } from '../services/user.service';

/**
 * Register all services with the DI container
 */
export function registerServices(): void {
  // Infrastructure
  container.registerSingleton(TYPES.Database, () => prisma);
  container.registerSingleton(TYPES.Logger, () => logger);

  // Repositories (Singleton)
  container.registerSingleton(
    TYPES.CustomerRepository,
    () => new CustomerRepository(container.resolve(TYPES.Database))
  );

  // Services (Singleton - stateless services can be singletons)
  container.registerSingleton(
    TYPES.CustomerService,
    () => new CustomerService()
  );

  container.registerSingleton(
    TYPES.OrganizationService,
    () => new OrganizationService()
  );

  container.registerSingleton(
    TYPES.ProductService,
    () => new ProductService()
  );

  container.registerSingleton(
    TYPES.InvoiceService,
    () => new InvoiceService()
  );

  container.registerSingleton(
    TYPES.AuthService,
    () => new AuthService()
  );

  container.registerSingleton(
    TYPES.ContractService,
    () => new ContractService()
  );

  container.registerSingleton(
    TYPES.CreditService,
    () => new CreditService()
  );

  container.registerSingleton(
    TYPES.CurrencyService,
    () => new CurrencyService()
  );

  container.registerSingleton(
    TYPES.FeatureService,
    () => new FeatureService()
  );

  container.registerSingleton(
    TYPES.MeterService,
    () => new MeterService()
  );

  container.registerSingleton(
    TYPES.PaymentService,
    () => new PaymentService()
  );

  container.registerSingleton(
    TYPES.PricingModelService,
    () => new PricingModelService()
  );

  container.registerSingleton(
    TYPES.RateLimitService,
    () => new RateLimitService()
  );

  container.registerSingleton(
    TYPES.TaxService,
    () => new TaxService()
  );

  container.registerSingleton(
    TYPES.TaxExemptionService,
    () => new TaxExemptionService()
  );

  container.registerSingleton(
    TYPES.TaxRegionService,
    () => new TaxRegionService()
  );

  container.registerSingleton(
    TYPES.UsageLimitService,
    () => new UsageLimitService()
  );

  container.registerSingleton(
    TYPES.UserService,
    () => new UserService()
  );

  logger.info('✅ All services registered with DI container');
}
