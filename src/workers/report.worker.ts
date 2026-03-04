/**
 * Report Job Processor
 * 
 * Process report generation background jobs
 */

import { Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import prisma from '../config/database';
import logger from '../config/logger';
import { ReportJobData, ReportJobType, QUEUE_NAMES } from '../config/queue';

// Redis connection for worker
const redisConnection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

/**
 * Process revenue report generation
 */
async function processRevenueReport(job: Job<ReportJobData>) {
  const { organizationId, dateRange } = job.data;

  logger.info(`[Report Job] Generating revenue report for org ${organizationId}`, {
    jobId: job.id,
  });

  try {
    await job.updateProgress(20);

    // Fetch invoices for the period
    const invoices = await prisma.invoices.findMany({
      where: {
        customers: {
          org_id: organizationId,
        },
        issue_date: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
        status: {
          in: ['paid', 'finalized'],
        },
      },
      include: {
        customers: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    await job.updateProgress(50);

    // Calculate revenue metrics
    const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
    const averageInvoiceValue = totalRevenue / invoices.length || 0;
    
    const revenueByCustomer = invoices.reduce((acc: any, inv) => {
      const customerName = inv.customers?.name || 'Unknown';
      acc[customerName] = (acc[customerName] || 0) + Number(inv.total);
      return acc;
    }, {});

    await job.updateProgress(75);

    // Generate report data
    const report = {
      organizationId,
      type: 'revenue',
      dateRange,
      generatedAt: new Date(),
      metrics: {
        totalRevenue,
        invoiceCount: invoices.length,
        averageInvoiceValue,
        revenueByCustomer,
      },
      invoices: invoices.map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoice_number,
        customerName: inv.customers?.name,
        amount: inv.total,
        status: inv.status,
        issueDate: inv.issue_date,
      })),
    };

    await job.updateProgress(100);

    logger.info(`[Report Job] Revenue report generated successfully`, {
      jobId: job.id,
      invoiceCount: invoices.length,
      totalRevenue,
    });

    return report;
  } catch (error: any) {
    logger.error(`[Report Job] Failed to generate revenue report: ${error.message}`, {
      jobId: job.id,
      error: error.stack,
    });
    throw error;
  }
}

/**
 * Process usage report generation
 */
async function processUsageReport(job: Job<ReportJobData>) {
  const { organizationId, dateRange } = job.data;

  logger.info(`[Report Job] Generating usage report for org ${organizationId}`, {
    jobId: job.id,
  });

  try {
    await job.updateProgress(20);

    // TODO: Implement usage tracking table
    // For now, return a placeholder report
    const usageData = {
      totalEvents: 0,
      usageByMeter: {},
      usageByCustomer: {},
    };

    await job.updateProgress(75);

    const report = {
      organizationId,
      type: 'usage',
      dateRange,
      generatedAt: new Date(),
      metrics: usageData,
    };

    await job.updateProgress(100);

    logger.info(`[Report Job] Usage report generated successfully`, {
      jobId: job.id,
      eventCount: usageData.totalEvents,
    });

    return report;
  } catch (error: any) {
    logger.error(`[Report Job] Failed to generate usage report: ${error.message}`, {
      jobId: job.id,
      error: error.stack,
    });
    throw error;
  }
}

/**
 * Process customer report generation
 */
async function processCustomerReport(job: Job<ReportJobData>) {
  const { organizationId, dateRange } = job.data;

  logger.info(`[Report Job] Generating customer report for org ${organizationId}`, {
    jobId: job.id,
  });

  try {
    const customers = await prisma.customers.findMany({
      where: {
        org_id: organizationId,
        created_at: {
          lte: dateRange.end,
        },
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
        _count: {
          select: {
            invoices: true,
          },
        },
      },
    });

    const report = {
      organizationId,
      type: 'customer',
      dateRange,
      generatedAt: new Date(),
      metrics: {
        totalCustomers: customers.length,
        activeCustomers: customers.filter(c => c.status === 'active').length,
        averageMRR: customers.reduce((sum, c) => sum + Number(c.mrr || 0), 0) / customers.length,
      },
      customers: customers.map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        status: c.status,
        mrr: c.mrr,
        invoiceCount: c._count.invoices,
      })),
    };

    await job.updateProgress(100);

    logger.info(`[Report Job] Customer report generated successfully`, {
      jobId: job.id,
      customerCount: customers.length,
    });

    return report;
  } catch (error: any) {
    logger.error(`[Report Job] Failed to generate customer report: ${error.message}`, {
      jobId: job.id,
      error: error.stack,
    });
    throw error;
  }
}

/**
 * Main job processor
 */
async function processReportJob(job: Job<ReportJobData>) {
  const { type } = job.data;

  switch (type) {
    case ReportJobType.REVENUE:
      return await processRevenueReport(job);
    case ReportJobType.USAGE:
      return await processUsageReport(job);
    case ReportJobType.CUSTOMER:
      return await processCustomerReport(job);
    case ReportJobType.MRR:
      // Handle MRR report logic
      return { status: 'mrr-report-generated' };
    default:
      throw new Error(`Unknown report job type: ${type}`);
  }
}

// Create worker
export const reportWorker = new Worker(QUEUE_NAMES.REPORT, processReportJob, {
  connection: redisConnection,
  concurrency: 3, // Process 3 report jobs concurrently
  limiter: {
    max: 50, // Max 50 jobs
    duration: 60000, // per minute
  },
});

// Worker event handlers
reportWorker.on('completed', (job) => {
  logger.info(`[Report Worker] Job completed: ${job.id}`);
});

reportWorker.on('failed', (job, err) => {
  logger.error(`[Report Worker] Job failed: ${job?.id}`, {
    error: err.message,
  });
});

reportWorker.on('stalled', (jobId) => {
  logger.warn(`[Report Worker] Job stalled: ${jobId}`);
});

logger.info('✅ Report worker initialized');
