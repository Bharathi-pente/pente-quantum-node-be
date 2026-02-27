/**
 * DataLoader Factory
 * 
 * Create DataLoader instances for efficient batch loading and caching
 */

import DataLoader from 'dataloader';
import prisma from '../config/database';
import logger from '../config/logger';

/**
 * Customer DataLoader - Batch load customers by ID
 */
export const createCustomerLoader = () => {
  return new DataLoader(async (customerIds: readonly string[]) => {
    try {
      const customers = await prisma.customers.findMany({
        where: {
          id: {
            in: [...customerIds],
          },
        },
      });

      // Create a map for O(1) lookup
      const customerMap = new Map(customers.map(c => [c.id, c]));

      // Return customers in the same order as requested IDs
      return customerIds.map(id => customerMap.get(id) || null);
    } catch (error: any) {
      logger.error('DataLoader: Failed to batch load customers', error);
      throw error;
    }
  }, {
    cache: true, // Enable per-request caching
    maxBatchSize: 100, // Maximum batch size
  });
};

/**
 * Organization DataLoader - Batch load organizations by ID
 */
export const createOrganizationLoader = () => {
  return new DataLoader(async (orgIds: readonly string[]) => {
    try {
      const organizations = await prisma.organizations.findMany({
        where: {
          id: {
            in: [...orgIds],
          },
        },
      });

      const orgMap = new Map(organizations.map(o => [o.id, o]));
      return orgIds.map(id => orgMap.get(id) || null);
    } catch (error: any) {
      logger.error('DataLoader: Failed to batch load organizations', error);
      throw error;
    }
  }, {
    cache: true,
    maxBatchSize: 50,
  });
};

/**
 * Product DataLoader - Batch load products by ID
 */
export const createProductLoader = () => {
  return new DataLoader(async (productIds: readonly string[]) => {
    try {
      const products = await prisma.products.findMany({
        where: {
          id: {
            in: [...productIds],
          },
        },
      });

      const productMap = new Map(products.map(p => [p.id, p]));
      return productIds.map(id => productMap.get(id) || null);
    } catch (error: any) {
      logger.error('DataLoader: Failed to batch load products', error);
      throw error;
    }
  }, {
    cache: true,
    maxBatchSize: 100,
  });
};

/**
 * Product by Customer DataLoader - Load products for a customer
 * Note: Uses direct relationship via customer.product_id
 */
export const createProductsByCustomerLoader = () => {
  return new DataLoader(async (customerIds: readonly string[]) => {
    try {
      // Fetch customers with their products
      const customersWithProducts = await prisma.customers.findMany({
        where: {
          id: {
            in: [...customerIds],
          },
        },
        include: {
          products: true,
        },
      });

      // Create a map for O(1) lookup
      const productsByCustomer = new Map<string, any[]>();
      customerIds.forEach(id => productsByCustomer.set(id, []));

      customersWithProducts.forEach(customer => {
        if (customer.products) {
          productsByCustomer.set(customer.id, [customer.products]);
        }
      });

      return customerIds.map(id => productsByCustomer.get(id) || []);
    } catch (error: any) {
      logger.error('DataLoader: Failed to batch load products by customer', error);
      throw error;
    }
  }, {
    cache: true,
    maxBatchSize: 50,
  });
};

/**
 * Invoice DataLoader - Batch load invoices by ID
 */
export const createInvoiceLoader = () => {
  return new DataLoader(async (invoiceIds: readonly string[]) => {
    try {
      const invoices = await prisma.invoices.findMany({
        where: {
          id: {
            in: [...invoiceIds],
          },
        },
      });

      const invoiceMap = new Map(invoices.map(i => [i.id, i]));
      return invoiceIds.map(id => invoiceMap.get(id) || null);
    } catch (error: any) {
      logger.error('DataLoader: Failed to batch load invoices', error);
      throw error;
    }
  }, {
    cache: true,
    maxBatchSize: 100,
  });
};

/**
 * Invoices by Customer DataLoader - Load invoices for a customer
 */
export const createInvoicesByCustomerLoader = () => {
  return new DataLoader(async (customerIds: readonly string[]) => {
    try {
      const invoices = await prisma.invoices.findMany({
        where: {
          customer_id: {
            in: [...customerIds],
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      // Group by customer ID
      const invoicesByCustomer = new Map<string, any[]>();
      customerIds.forEach(id => invoicesByCustomer.set(id, []));

      invoices.forEach(invoice => {
        const existing = invoicesByCustomer.get(invoice.customer_id) || [];
        existing.push(invoice);
        invoicesByCustomer.set(invoice.customer_id, existing);
      });

      return customerIds.map(id => invoicesByCustomer.get(id) || []);
    } catch (error: any) {
      logger.error('DataLoader: Failed to batch load invoices by customer', error);
      throw error;
    }
  }, {
    cache: true,
    maxBatchSize: 50,
  });
};

/**
 * Contracts by Customer DataLoader
 */
export const createContractsByCustomerLoader = () => {
  return new DataLoader(async (customerIds: readonly string[]) => {
    try {
      const contracts = await prisma.contracts.findMany({
        where: {
          customer_id: {
            in: [...customerIds],
          },
        },
      });

      const contractsByCustomer = new Map<string, any[]>();
      customerIds.forEach(id => contractsByCustomer.set(id, []));

      contracts.forEach(contract => {
        const existing = contractsByCustomer.get(contract.customer_id) || [];
        existing.push(contract);
        contractsByCustomer.set(contract.customer_id, existing);
      });

      return customerIds.map(id => contractsByCustomer.get(id) || []);
    } catch (error: any) {
      logger.error('DataLoader: Failed to batch load contracts by customer', error);
      throw error;
    }
  }, {
    cache: true,
    maxBatchSize: 50,
  });
};

/**
 * Create all loaders - typically called per request
 */
export interface DataLoaders {
  customerLoader: DataLoader<string, any>;
  organizationLoader: DataLoader<string, any>;
  productLoader: DataLoader<string, any>;
  productsByCustomerLoader: DataLoader<string, any[]>;
  invoiceLoader: DataLoader<string, any>;
  invoicesByCustomerLoader: DataLoader<string, any[]>;
  contractsByCustomerLoader: DataLoader<string, any[]>;
}

export const createDataLoaders = (): DataLoaders => {
  return {
    customerLoader: createCustomerLoader(),
    organizationLoader: createOrganizationLoader(),
    productLoader: createProductLoader(),
    productsByCustomerLoader: createProductsByCustomerLoader(),
    invoiceLoader: createInvoiceLoader(),
    invoicesByCustomerLoader: createInvoicesByCustomerLoader(),
    contractsByCustomerLoader: createContractsByCustomerLoader(),
  };
};

logger.info('✅ DataLoader factory created');
