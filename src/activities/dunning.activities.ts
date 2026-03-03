/**
 * Dunning Activities
 *
 * Individual activities that workflows can execute
 */

import { Context } from '@temporalio/activity';
import nodemailer from 'nodemailer';
import prisma from '../config/database';
import logger from '../config/logger';

export interface EmailData {
  to: string;
  customerName: string;
  invoiceNumber: string;
  amount: number;
  dueDate: Date;
  stepNumber: number;
  templateName?: string;
  subject?: string;
}

export interface EscalationData {
  invoiceId: string;
  customerId: string;
  assignee?: string;
  escalateTo?: string;
  stepNumber: number;
}

/**
 * Send dunning email to customer
 */
export async function sendDunningEmail(emailData: EmailData): Promise<void> {
  const activityContext = Context.current();

  logger.info('Sending dunning email', {
    activityId: activityContext.info.activityId,
    invoiceNumber: emailData.invoiceNumber,
    stepNumber: emailData.stepNumber,
  });

  try {
    // Create SMTP transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Email content
    const mailOptions = {
      from: `"Quantum Billing" <${process.env.SMTP_FROM}>`,
      to: emailData.to,
      subject: emailData.subject || `Payment Reminder - Invoice ${emailData.invoiceNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Payment Reminder</h2>

          <p>Dear ${emailData.customerName},</p>

          <p>This is a reminder that invoice <strong>${emailData.invoiceNumber}</strong> for <strong>$${emailData.amount.toFixed(2)}</strong> is overdue.</p>

          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Invoice Number:</strong> ${emailData.invoiceNumber}</p>
            <p><strong>Amount Due:</strong> $${emailData.amount.toFixed(2)}</p>
            <p><strong>Due Date:</strong> ${emailData.dueDate.toLocaleDateString()}</p>
          </div>

          <p>Please remit payment at your earliest convenience to avoid additional fees and potential service interruption.</p>

          <p>If you have already made payment, please disregard this notice.</p>

          <p>Thank you for your prompt attention to this matter.</p>

          <p>Best regards,<br>
          Billing Department<br>
          Quantum Billing</p>
        </div>
      `,
      text: `
        Dear ${emailData.customerName},

        This is a reminder that invoice ${emailData.invoiceNumber} for $${emailData.amount.toFixed(2)} is overdue.

        Invoice Number: ${emailData.invoiceNumber}
        Amount Due: $${emailData.amount.toFixed(2)}
        Due Date: ${emailData.dueDate.toLocaleDateString()}

        Please remit payment at your earliest convenience to avoid additional fees.

        If you have already made payment, please disregard this notice.

        Thank you,
        Billing Department
        Quantum Billing
      `,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    logger.info('Dunning email sent successfully', {
      to: emailData.to,
      invoiceNumber: emailData.invoiceNumber,
      messageId: info.messageId,
    });

  } catch (error) {
    logger.error('Failed to send dunning email', {
      error: error instanceof Error ? error.message : String(error),
      invoiceNumber: emailData.invoiceNumber,
    });
    throw error;
  }
}

/**
 * Update invoice dunning step in database
 */
export async function updateInvoiceDunningStep(invoiceId: string, step: number): Promise<void> {
  const activityContext = Context.current();

  logger.info('Updating invoice dunning step', {
    activityId: activityContext.info.activityId,
    invoiceId,
    step,
  });

  try {
    await prisma.invoices.update({
      where: { id: invoiceId },
      data: { dunning_step: step },
    });

    logger.info('Invoice dunning step updated', { invoiceId, step });

  } catch (error) {
    logger.error('Failed to update invoice dunning step', {
      error: error instanceof Error ? error.message : String(error),
      invoiceId,
    });
    throw error;
  }
}

/**
 * Check if payment has been received for invoice
 */
export async function checkPaymentStatus(invoiceId: string): Promise<boolean> {
  const activityContext = Context.current();

  logger.info('Checking payment status', {
    activityId: activityContext.info.activityId,
    invoiceId,
  });

  try {
    const invoice = await prisma.invoices.findUnique({
      where: { id: invoiceId },
      select: { status: true },
    });

    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }

    const isPaid = invoice.status === 'paid';
    logger.info('Payment status checked', { invoiceId, isPaid });

    return isPaid;

  } catch (error) {
    logger.error('Failed to check payment status', {
      error: error instanceof Error ? error.message : String(error),
      invoiceId,
    });
    throw error;
  }
}

/**
 * Escalate dunning to another team/department
 */
export async function escalateDunning(escalationData: EscalationData): Promise<void> {
  const activityContext = Context.current();

  logger.info('Escalating dunning case', {
    activityId: activityContext.info.activityId,
    invoiceId: escalationData.invoiceId,
    stepNumber: escalationData.stepNumber,
  });

  try {
    // Send escalation notification email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const escalationEmail = {
      from: `"Quantum Billing" <${process.env.SMTP_FROM}>`,
      to: escalationData.escalateTo || process.env.SMTP_FROM, // Send to escalation contact or fallback to sender
      subject: `Dunning Escalation - Invoice ${escalationData.invoiceId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc3545;">Dunning Case Escalation</h2>

          <p>A dunning case has been escalated and requires your attention.</p>

          <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <p><strong>Invoice ID:</strong> ${escalationData.invoiceId}</p>
            <p><strong>Customer ID:</strong> ${escalationData.customerId}</p>
            <p><strong>Escalation Step:</strong> ${escalationData.stepNumber}</p>
            <p><strong>Assignee:</strong> ${escalationData.assignee || 'Unassigned'}</p>
          </div>

          <p>Please review this case and take appropriate action.</p>

          <p>Best regards,<br>
          Automated Dunning System<br>
          Quantum Billing</p>
        </div>
      `,
      text: `
        Dunning Case Escalation

        A dunning case has been escalated and requires your attention.

        Invoice ID: ${escalationData.invoiceId}
        Customer ID: ${escalationData.customerId}
        Escalation Step: ${escalationData.stepNumber}
        Assignee: ${escalationData.assignee || 'Unassigned'}

        Please review this case and take appropriate action.

        Best regards,
        Automated Dunning System
        Quantum Billing
      `,
    };

    // Send escalation email
    const info = await transporter.sendMail(escalationEmail);

    logger.info('Dunning case escalated and notification sent', {
      invoiceId: escalationData.invoiceId,
      escalationEmail: escalationData.escalateTo || process.env.SMTP_FROM,
      messageId: info.messageId,
    });

  } catch (error) {
    logger.error('Failed to escalate dunning case', {
      error: error instanceof Error ? error.message : String(error),
      invoiceId: escalationData.invoiceId,
    });
    throw error;
  }
}

/**
 * Get dunning policy with steps
 */
export async function getDunningPolicy(policyId: string): Promise<any> {
  const activityContext = Context.current();

  logger.info('Getting dunning policy', {
    activityId: activityContext.info.activityId,
    policyId,
  });

  try {
    const policy = await prisma.dunning_policies.findUnique({
      where: { id: policyId },
      include: {
        dunning_steps: {
          orderBy: { sort_order: 'asc' },
        },
      },
    });

    if (!policy) {
      throw new Error(`Dunning policy ${policyId} not found`);
    }

    logger.info('Dunning policy retrieved', { policyId, stepCount: policy.dunning_steps.length });

    return policy;

  } catch (error) {
    logger.error('Failed to get dunning policy', {
      error: error instanceof Error ? error.message : String(error),
      policyId,
    });
    throw error;
  }
}