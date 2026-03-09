/**
 * Repository Factory
 * 
 * Central place to instantiate and export all repositories.
 * This enables dependency injection and makes testing easier.
 */

import prisma from '../config/database';
import { CustomerRepository } from './implementations/CustomerRepository';
import { WebhookRepository, WebhookLogRepository, WebhookEventRepository } from './implementations/WebhookRepository';
import { ComplianceRepository } from './implementations/ComplianceRepository';
import { DataRetentionRepository } from './implementations/DataRetentionRepository';
import { GDPRRepository } from './implementations/GDPRRepository';
// Import other repositories as they are created
// import { ProductRepository } from './implementations/ProductRepository';
// import { InvoiceRepository } from './implementations/InvoiceRepository';

// Export repository instances
export const customerRepository = new CustomerRepository(prisma);
export const webhookRepository = new WebhookRepository();
export const webhookLogRepository = new WebhookLogRepository();
export const webhookEventRepository = new WebhookEventRepository();
export const complianceRepository = new ComplianceRepository(prisma);
export const dataRetentionRepository = new DataRetentionRepository(prisma);
export const gdprRepository = new GDPRRepository(prisma);
// export const productRepository = new ProductRepository(prisma);
// export const invoiceRepository = new InvoiceRepository(prisma);

// Export repository classes for testing (to create mock instances)
export { CustomerRepository } from './implementations/CustomerRepository';
export { WebhookRepository, WebhookLogRepository, WebhookEventRepository } from './implementations/WebhookRepository';
export { ComplianceRepository } from './implementations/ComplianceRepository';
export { DataRetentionRepository } from './implementations/DataRetentionRepository';
export { GDPRRepository } from './implementations/GDPRRepository';
export { BaseRepository } from './implementations/BaseRepository';

// Export interfaces
export * from './interfaces/IBaseRepository';
export * from './interfaces/ICustomerRepository';
export * from './interfaces/IWebhookRepository';
export * from './interfaces/IComplianceRepository';
export * from './interfaces/IDataRetentionRepository';
export * from './interfaces/IGDPRRepository';
