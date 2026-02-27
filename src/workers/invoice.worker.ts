/**
 * Invoice Job Processor
 * 
 * Process invoice-related background jobs
 */

import { Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import prisma from '../config/database';
import logger from '../config/logger';
import { InvoiceJobData, InvoiceJobType, QUEUE_NAMES } from '../config/queue';

// Redis connection for worker
const redisConnection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

/**
 * Process invoice generation job
 */
async function processInvoiceGeneration(job: Job<InvoiceJobData>) {
  const { customerId, organizationId } = job.data;

  logger.info(`[Invoice Job] Generating invoice for customer ${customerId}`, {
    jobId: job.id,
    organizationId,
  });

  try {
    // Fetch customer
    const customer = await prisma.customers.findUnique({
      where: { id: customerId },
      include: {
        products: true,
        contracts: {
          where: {
            status: 'active',
          },
        },
      },
    });

    if (!customer || !customer.id) {
      throw new Error(`Customer not found: ${customerId}`);
    }

    // Calculate invoice line items based on products and usage
    // This is a simplified example - you'd implement your actual billing logic
    const lineItems = [];

    if (customer.products) {
      lineItems.push({
        description: customer.products.name,
        quantity: 1,
        unit_price: customer.products.base_price,
        amount: customer.products.base_price,
      });
    }

    // Calculate totals
    const subtotal = lineItems.reduce((sum: number, item: any) => sum + item.amount, 0);
    const tax = subtotal * 0.1; // 10% tax example
    const total = subtotal + tax;

    // Create invoice
    const invoice = await prisma.invoices.create({
      data: {
        customer_id: customer.id,
        invoice_number: `INV-${Date.now()}`,
        status: 'draft',
        issue_date: new Date(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        subtotal,
        tax_amount: tax,
        total,
        currency: 'USD', // Default currency
      },
    });

    // Create invoice line items
    if (lineItems.length > 0) {
      await prisma.invoice_line_items.createMany({
        data: lineItems.map((item, index) => ({
          invoice_id: invoice.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.amount,
          sort_order: index,
        })),
      });
    }

    await job.updateProgress(100);

    logger.info(`[Invoice Job] Invoice generated successfully: ${invoice.id}`, {
      jobId: job.id,
      invoiceId: invoice.id,
    });

    return { invoiceId: invoice.id, status: 'generated' };
  } catch (error: any) {
    logger.error(`[Invoice Job] Failed to generate invoice: ${error.message}`, {
      jobId: job.id,
      error: error.stack,
    });
    throw error;
  }
}

/**
 * Process invoice finalization job
 */
async function processInvoiceFinalization(job: Job<InvoiceJobData>) {
  const { invoiceId } = job.data;

  logger.info(`[Invoice Job] Finalizing invoice ${invoiceId}`, {
    jobId: job.id,
  });

  try {
    const invoice = await prisma.invoices.update({
      where: { id: invoiceId },
      data: {
        status: 'sent',
      },
    });

    await job.updateProgress(100);

    logger.info(`[Invoice Job] Invoice finalized: ${invoiceId}`, {
      jobId: job.id,
    });

    return { invoiceId: invoice.id, status: 'sent' };
  } catch (error: any) {
    logger.error(`[Invoice Job] Failed to finalize invoice: ${error.message}`, {
      jobId: job.id,
      error: error.stack,
    });
    throw error;
  }
}

/**
 * Process invoice sending job
 */
async function processInvoiceSending(job: Job<InvoiceJobData>) {
  const { invoiceId } = job.data;

  logger.info(`[Invoice Job] Sending invoice ${invoiceId}`, {
    jobId: job.id,
  });

  try {
    // Update invoice status
    const invoice = await prisma.invoices.update({
      where: { id: invoiceId },
      data: {
        status: 'sent',
      },
      include: {
        customers: true,
      },
    });

    // TODO: Integrate with email service to send invoice
    // await emailService.sendInvoice(invoice);

    await job.updateProgress(100);

    logger.info(`[Invoice Job] Invoice sent: ${invoiceId}`, {
      jobId: job.id,
    });

    return { invoiceId: invoice.id, status: 'sent' };
  } catch (error: any) {
    logger.error(`[Invoice Job] Failed to send invoice: ${error.message}`, {
      jobId: job.id,
      error: error.stack,
    });
    throw error;
  }
}

/**
 * Main job processor
 */
async function processInvoiceJob(job: Job<InvoiceJobData>) {
  const { type } = job.data;

  switch (type) {
    case InvoiceJobType.GENERATE:
      return await processInvoiceGeneration(job);
    case InvoiceJobType.FINALIZE:
      return await processInvoiceFinalization(job);
    case InvoiceJobType.SEND:
      return await processInvoiceSending(job);
    case InvoiceJobType.VOID:
      // Handle void logic
      return { status: 'voided' };
    default:
      throw new Error(`Unknown invoice job type: ${type}`);
  }
}

// Create worker
export const invoiceWorker = new Worker(QUEUE_NAMES.INVOICE, processInvoiceJob, {
  connection: redisConnection,
  concurrency: 5, // Process 5 jobs concurrently
  limiter: {
    max: 100, // Max 100 jobs
    duration: 60000, // per minute
  },
});

// Worker event handlers
invoiceWorker.on('completed', (job) => {
  logger.info(`[Invoice Worker] Job completed: ${job.id}`);
});

invoiceWorker.on('failed', (job, err) => {
  logger.error(`[Invoice Worker] Job failed: ${job?.id}`, {
    error: err.message,
  });
});

invoiceWorker.on('stalled', (jobId) => {
  logger.warn(`[Invoice Worker] Job stalled: ${jobId}`);
});

logger.info('✅ Invoice worker initialized');
