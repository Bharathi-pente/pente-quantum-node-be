/**
 * Repository Factory
 * 
 * Central place to instantiate and export all repositories.
 * This enables dependency injection and makes testing easier.
 */

import prisma from '../config/database';
import { CustomerRepository } from './implementations/CustomerRepository';
import { WebhookRepository, WebhookLogRepository, WebhookEventRepository } from './implementations/WebhookRepository';
// Import other repositories as they are created
// import { ProductRepository } from './implementations/ProductRepository';
// import { InvoiceRepository } from './implementations/InvoiceRepository';

// Export repository instances
export const customerRepository = new CustomerRepository(prisma);
export const webhookRepository = new WebhookRepository();
export const webhookLogRepository = new WebhookLogRepository();
export const webhookEventRepository = new WebhookEventRepository();
// export const productRepository = new ProductRepository(prisma);
// export const invoiceRepository = new InvoiceRepository(prisma);

// Export repository classes for testing (to create mock instances)
export { CustomerRepository } from './implementations/CustomerRepository';
export { WebhookRepository, WebhookLogRepository, WebhookEventRepository } from './implementations/WebhookRepository';
export { BaseRepository } from './implementations/BaseRepository';

// Export interfaces
export * from './interfaces/IBaseRepository';
export * from './interfaces/ICustomerRepository';
export * from './interfaces/IWebhookRepository';
