/**
 * Dunning Workflow Service
 *
 * Service for starting and managing dunning workflows
 */

import { Client } from '@temporalio/client';
import { createTemporalClient } from '../config/temporal';
import { dunningWorkflow } from '../workflows/dunning.workflow';
import logger from '../config/logger';

export interface StartDunningWorkflowParams {
  invoiceId: string;
  policyId: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
  invoiceNumber: string;
  amount: number;
  dueDate: Date;
  orgId: string;
}

export class DunningWorkflowService {
  private client: Client | null = null;

  private async getClient(): Promise<Client> {
    if (!this.client) {
      this.client = await createTemporalClient();
    }
    return this.client!;
  }

  /**
   * Start a dunning workflow for an overdue invoice
   */
  async startDunningWorkflow(params: StartDunningWorkflowParams): Promise<string> {
    try {
      const client = await this.getClient();

      const workflowId = `dunning-${params.invoiceId}`;

      await client.workflow.start(dunningWorkflow, {
        taskQueue: 'dunning-queue',
        workflowId,
        args: [params],
      });

      logger.info('Started dunning workflow', {
        workflowId,
        invoiceId: params.invoiceId,
        customerId: params.customerId,
      });

      return workflowId;

    } catch (error) {
      logger.error('Failed to start dunning workflow', {
        error: error instanceof Error ? error.message : String(error),
        invoiceId: params.invoiceId,
      });
      throw error;
    }
  }

  /**
   * Get the status of a dunning workflow
   */
  async getWorkflowStatus(workflowId: string): Promise<any> {
    try {
      const client = await this.getClient();

      const handle = client.workflow.getHandle(workflowId);
      const description = await handle.describe();

      return {
        workflowId,
        status: description.status.name,
        startTime: description.startTime,
        executionTime: description.executionTime,
        closeTime: description.closeTime,
      };

    } catch (error) {
      logger.error('Failed to get workflow status', {
        error: error instanceof Error ? error.message : String(error),
        workflowId,
      });
      throw error;
    }
  }

  /**
   * Send a signal to a dunning workflow
   */
  async sendWorkflowSignal(workflowId: string, signalName: string, signalData?: any): Promise<void> {
    try {
      const client = await this.getClient();

      const handle = client.workflow.getHandle(workflowId);

      switch (signalName) {
        case 'pause':
          await handle.signal('pauseDunning');
          break;
        case 'resume':
          await handle.signal('resumeDunning');
          break;
        case 'cancel':
          await handle.signal('cancelDunning');
          break;
        case 'paymentReceived':
          await handle.signal('paymentReceived');
          break;
        default:
          throw new Error(`Unknown signal: ${signalName}`);
      }

      logger.info('Sent signal to dunning workflow', {
        workflowId,
        signalName,
        signalData,
      });

    } catch (error) {
      logger.error('Failed to send workflow signal', {
        error: error instanceof Error ? error.message : String(error),
        workflowId,
        signalName,
      });
      throw error;
    }
  }

  /**
   * Query a dunning workflow for current status
   */
  async queryWorkflowStatus(workflowId: string): Promise<any> {
    try {
      const client = await this.getClient();

      const handle = client.workflow.getHandle(workflowId);
      const status = await handle.query('getStatus');

      return status;

    } catch (error) {
      logger.error('Failed to query workflow status', {
        error: error instanceof Error ? error.message : String(error),
        workflowId,
      });
      throw error;
    }
  }

  /**
   * Terminate a dunning workflow
   */
  async terminateWorkflow(workflowId: string, reason?: string): Promise<void> {
    try {
      const client = await this.getClient();

      const handle = client.workflow.getHandle(workflowId);
      await handle.terminate(reason || 'Terminated by user');

      logger.info('Terminated dunning workflow', {
        workflowId,
        reason,
      });

    } catch (error) {
      logger.error('Failed to terminate workflow', {
        error: error instanceof Error ? error.message : String(error),
        workflowId,
      });
      throw error;
    }
  }
}

// Export singleton instance
export const dunningWorkflowService = new DunningWorkflowService();