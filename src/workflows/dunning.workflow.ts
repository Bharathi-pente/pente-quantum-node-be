/**
 * Dunning Workflow
 *
 * Orchestrates the automated dunning process for overdue invoices
 */

import { proxyActivities, defineQuery, defineSignal, setHandler, sleep } from '@temporalio/workflow';
import type * as activities from '../activities/dunning.activities';

const { sendDunningEmail, updateInvoiceDunningStep, checkPaymentStatus, escalateDunning } = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 seconds',
  retry: {
    initialInterval: '1 second',
    maximumInterval: '60 seconds',
    backoffCoefficient: 2,
    maximumAttempts: 3,
  },
});

export interface DunningWorkflowInput {
  invoiceId: string;
  policyId: string;
  orgId: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
  invoiceNumber: string;
  amount: number;
  dueDate: Date;
}

export interface DunningWorkflowStatus {
  currentStep: number;
  totalSteps: number;
  status: 'running' | 'paused' | 'completed' | 'failed';
  lastAction: string;
  nextActionDate?: Date;
}

// Query to get current workflow status
export const getStatus = defineQuery<DunningWorkflowStatus>('getStatus');

// Signals for manual intervention
export const pauseSignal = defineSignal('pause');
export const resumeSignal = defineSignal('resume');
export const cancelSignal = defineSignal('cancel');

export async function dunningWorkflow(input: DunningWorkflowInput): Promise<string> {
  let isPaused = false;
  let isCancelled = false;
  let currentStep = 0;

  // Set up signal handlers
  setHandler(pauseSignal, () => {
    isPaused = true;
  });

  setHandler(resumeSignal, () => {
    isPaused = false;
  });

  setHandler(cancelSignal, () => {
    isCancelled = true;
  });

  // Set up status query handler
  setHandler(getStatus, () => ({
    currentStep,
    totalSteps: 4, // Default, will be updated based on policy
    status: isCancelled ? 'failed' : isPaused ? 'paused' : 'running',
    lastAction: `Processing step ${currentStep + 1}`,
    nextActionDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next day
  }));

  try {
    // Get dunning policy and steps
    const policy = await proxyActivities<typeof activities>({
      startToCloseTimeout: '10 seconds',
    }).getDunningPolicy(input.policyId);

    if (!policy || !policy.dunning_steps) {
      throw new Error(`Dunning policy ${input.policyId} not found or has no steps`);
    }

    const steps = policy.dunning_steps.sort((a: any, b: any) => a.sort_order - b.sort_order);

    // Execute each dunning step
    for (let i = 0; i < steps.length; i++) {
      currentStep = i;
      const step = steps[i];

      // Check for cancellation
      if (isCancelled) {
        await updateInvoiceDunningStep(input.invoiceId, -1); // Mark as cancelled
        return 'Dunning process cancelled';
      }

      // Wait for pause/resume
      while (isPaused) {
        await sleep('1 hour'); // Check every hour while paused
      }

      // Wait for the step's day offset
      if (step.day_offset > 0) {
        await sleep(`${step.day_offset} days`);
      }

      // Check if payment was received before executing step
      const paymentReceived = await checkPaymentStatus(input.invoiceId);
      if (paymentReceived) {
        await updateInvoiceDunningStep(input.invoiceId, -2); // Mark as paid
        return 'Payment received - dunning process completed';
      }

      // Execute the dunning action
      switch (step.action) {
        case 'email':
          await sendDunningEmail({
            to: input.customerEmail,
            customerName: input.customerName,
            invoiceNumber: input.invoiceNumber,
            amount: input.amount,
            dueDate: input.dueDate,
            stepNumber: i + 1,
            templateName: step.template_name,
            subject: step.subject,
            orgId: input.orgId,
            customerId: input.customerId,
            invoiceId: input.invoiceId,
          });
          break;

        case 'escalate':
          await escalateDunning({
            invoiceId: input.invoiceId,
            customerId: input.customerId,
            assignee: step.assignee,
            escalateTo: step.escalate_to,
            stepNumber: i + 1,
          });
          break;

        case 'call':
          // For now, just log the call action
          // In production, this would integrate with a calling service
          console.log(`Initiating phone call to ${input.customerName} for invoice ${input.invoiceNumber}`);
          break;

        default:
          console.log(`Unknown dunning action: ${step.action}`);
      }

      // Update invoice dunning step
      await updateInvoiceDunningStep(input.invoiceId, i + 1);
    }

    return 'Dunning process completed successfully';

  } catch (error) {
    console.error('Dunning workflow failed:', error);
    await updateInvoiceDunningStep(input.invoiceId, -3); // Mark as failed
    throw error;
  }
}