/**
 * Dunning Scheduler Service
 *
 * Automatically checks for overdue invoices and starts dunning workflows
 */

import prisma from '../config/database';
import logger from '../config/logger';
import { dunningWorkflowService } from './dunning.workflow.service';

export class DunningSchedulerService {
  private isRunning = false;

  /**
   * Check for overdue invoices and start dunning workflows
   */
  async processOverdueInvoices(): Promise<void> {
    if (this.isRunning) {
      logger.info('Dunning scheduler already running, skipping...');
      return;
    }

    this.isRunning = true;
    logger.info('Starting dunning scheduler - checking for overdue invoices');

    try {
      const now = new Date();

      // Use transaction and limit batch size to prevent connection exhaustion
      const overdueInvoices = await prisma.$transaction(async (tx) => {
        return await tx.invoices.findMany({
          where: {
            status: 'pending',
            due_date: {
              lt: now,
            },
            // Only process invoices that haven't started dunning yet
            dunning_step: null,
          },
          include: {
            customers: {
              include: {
                organizations: {
                  include: {
                    dunning_policies: {
                      where: {
                        OR: [
                          { is_default: true },
                          { status: 'active' },
                        ],
                      },
                      orderBy: {
                        is_default: 'desc', // Prioritize default policy
                      },
                      take: 1,
                      include: {
                        dunning_steps: {
                          orderBy: {
                            sort_order: 'asc',
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          take: 50, // Limit batch size to prevent memory issues
          orderBy: {
            due_date: 'asc', // Process oldest first
          },
        });
      });

      logger.info(`Found ${overdueInvoices.length} overdue invoices to process`);

      let successCount = 0;
      let failureCount = 0;

      // Process each overdue invoice
      for (const invoice of overdueInvoices) {
        try {
          const customer = invoice.customers;
          if (!customer) {
            logger.warn('Invoice has no associated customer', { invoiceId: invoice.id });
            failureCount++;
            continue;
          }

          const organization = customer.organizations;
          if (!organization) {
            logger.warn('Customer has no associated organization', { 
              invoiceId: invoice.id,
              customerId: customer.id,
            });
            failureCount++;
            continue;
          }

          // Find dunning policy for this organization (prefer default, then active)
          const policy = await prisma.dunning_policies.findFirst({
            where: {
              OR: [
                { is_default: true },
                { status: 'active', org_id: organization.id },
              ],
            },
            include: {
              dunning_steps: {
                orderBy: { sort_order: 'asc' },
              },
            },
            orderBy: {
              is_default: 'desc',
            },
          });

          if (!policy) {
            logger.warn('No active dunning policy found for organization', {
              invoiceId: invoice.id,
              orgId: organization.id,
            });
            failureCount++;
            continue;
          }

          logger.info('Found dunning policy', {
            policyId: policy.id,
            policyName: policy.name,
            stepCount: policy.dunning_steps?.length || 0,
          });

          // Check if policy has steps
          if (!policy.dunning_steps || policy.dunning_steps.length === 0) {
            logger.warn('Dunning policy has no steps', {
              invoiceId: invoice.id,
              policyId: policy.id,
              policyName: policy.name,
              stepCount: policy.dunning_steps?.length || 0,
            });
            failureCount++;
            continue;
          }
          logger.info('Starting dunning workflow', {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoice_number,
            customerId: customer.id,
            policyId: policy.id,
            orgId: organization.id,
          });

          const workflowId = await dunningWorkflowService.startDunningWorkflow({
            invoiceId: invoice.id,
            policyId: policy.id,
            customerId: customer.id,
            customerEmail: customer.email,
            customerName: customer.name,
            invoiceNumber: invoice.invoice_number,
            amount: parseFloat(invoice.total.toString()),
            dueDate: invoice.due_date,
            orgId: organization.id,
          });

          // Mark the invoice as having dunning started
          await prisma.invoices.update({
            where: { id: invoice.id },
            data: {
              dunning_step: 0, // Initialize at step 0
            },
          });

          logger.info('Dunning workflow started successfully', {
            workflowId,
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoice_number,
          });

          successCount++;

        } catch (error) {
          logger.error('Failed to start dunning workflow for invoice', {
            error: error instanceof Error ? error.message : String(error),
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoice_number,
          });
          failureCount++;
        }
      }

      logger.info('Dunning scheduler completed', {
        total: overdueInvoices.length,
        successful: successCount,
        failed: failureCount,
      });

    } catch (error) {
      logger.error('Dunning scheduler failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Start a continuous scheduler that runs periodically
   * @param intervalMinutes - How often to check for overdue invoices (default: 60 minutes)
   */
  startScheduler(intervalMinutes: number = 60): void {
    logger.info('Starting dunning scheduler', {
      intervalMinutes,
    });

    // Run immediately on start
    this.processOverdueInvoices().catch((error) => {
      logger.error('Initial dunning scheduler run failed', { error });
    });

    // Then run periodically
    setInterval(async () => {
      try {
        await this.processOverdueInvoices();
      } catch (error) {
        logger.error('Scheduled dunning run failed', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }, intervalMinutes * 60 * 1000);
  }
}

// Export singleton instance
export const dunningSchedulerService = new DunningSchedulerService();
