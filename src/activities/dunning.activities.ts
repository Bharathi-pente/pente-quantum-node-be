/**
 * Dunning Activities
 *
 * Individual activities that workflows can execute
 */

import { Context } from '@temporalio/activity';
import nodemailer from 'nodemailer';
import prisma from '../config/database';
import logger from '../config/logger';
import emailTemplateService from '../services/email-template.service';

export interface EmailData {
  to: string;
  customerName: string;
  invoiceNumber: string;
  amount: number;
  dueDate: Date;
  stepNumber: number;
  templateName?: string;
  subject?: string;
  orgId: string;
  customerId: string;
  invoiceId: string;
}

export interface EscalationData {
  invoiceId: string;
  customerId: string;
  assignee?: string;
  escalateTo?: string;
  stepNumber: number;
}

export interface RetryPaymentData {
  invoiceId: string;
  customerId: string;
  amount: number;
  retryCount: number;
}

export interface SuspendServiceData {
  customerId: string;
  invoiceId: string;
  gracePeriodDays: number;
}

export interface CancelSubscriptionData {
  customerId: string;
  invoiceId: string;
  reason: string;
}

/**
 * Send dunning email to customer using email templates
 */
export async function sendDunningEmail(emailData: EmailData): Promise<void> {
  const activityContext = Context.current();

  logger.info('Sending dunning email', {
    activityId: activityContext.info.activityId,
    invoiceNumber: emailData.invoiceNumber,
    stepNumber: emailData.stepNumber,
    templateName: emailData.templateName,
  });

  return sendDunningEmailInternal(emailData);
}

/**
 * Send dunning email (internal function that can be called outside activities)
 */
export async function sendDunningEmailInternal(emailData: EmailData): Promise<void> {
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

    let htmlContent: string;
    let textContent: string | undefined;
    let subject: string;

    // Use template if specified
    if (emailData.templateName) {
      try {
        const rendered = await emailTemplateService.renderTemplate(
          emailData.templateName,
          emailData.orgId,
          {
            customer_name: emailData.customerName,
            invoice_number: emailData.invoiceNumber,
            amount: emailData.amount.toFixed(2),
            due_date: emailData.dueDate.toLocaleDateString(),
            step_number: emailData.stepNumber,
          }
        );
        htmlContent = rendered.html;
        textContent = rendered.text;
        subject = rendered.subject;
      } catch (error) {
        logger.warn('Failed to load email template, using default', { error });
        // Fall back to default template
        subject = emailData.subject || `Payment Reminder - Invoice ${emailData.invoiceNumber}`;
        htmlContent = getDefaultEmailHTML(emailData);
        textContent = getDefaultEmailText(emailData);
      }
    } else {
      subject = emailData.subject || `Payment Reminder - Invoice ${emailData.invoiceNumber}`;
      htmlContent = getDefaultEmailHTML(emailData);
      textContent = getDefaultEmailText(emailData);
    }

    // Email content
    const mailOptions = {
      from: `"Quantum Billing" <${process.env.SMTP_FROM}>`,
      to: emailData.to,
      subject,
      html: htmlContent,
      text: textContent,
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
 * Default email HTML template
 */
function getDefaultEmailHTML(emailData: EmailData): string {
  return `
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
  `;
}

/**
 * Default email text template
 */
function getDefaultEmailText(emailData: EmailData): string {
  return `
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
  `;
}

/**
 * Retry payment for an invoice
 */
export async function retryPayment(data: RetryPaymentData): Promise<boolean> {
  const activityContext = Context.current();

  logger.info('Retrying payment', {
    activityId: activityContext.info.activityId,
    invoiceId: data.invoiceId,
    retryCount: data.retryCount,
  });

  try {
    // Get customer and invoice details
    const invoice = await prisma.invoices.findUnique({
      where: { id: data.invoiceId },
      include: {
        customers: {
          include: {
            payment_methods: {
              where: { is_default: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!invoice || !invoice.customers) {
      throw new Error(`Invoice ${data.invoiceId} or customer not found`);
    }

    const defaultPaymentMethod = invoice.customers.payment_methods[0];
    if (!defaultPaymentMethod) {
      logger.warn('No default payment method found for customer', {
        customerId: data.customerId,
      });
      return false;
    }

    // TODO: Integrate with payment processor (Stripe/etc) to attempt charge
    // For now, just log the retry attempt
    logger.info('Payment retry initiated', {
      invoiceId: data.invoiceId,
      customerId: data.customerId,
      amount: data.amount,
      paymentMethodId: defaultPaymentMethod.id,
    });

    // Simulated retry - in production, this would call actual payment processor
    // const result = await chargePaymentMethod(defaultPaymentMethod.id, data.amount);
    
    return false; // Return false for now since we're not actually processing

  } catch (error) {
    logger.error('Failed to retry payment', {
      error: error instanceof Error ? error.message : String(error),
      invoiceId: data.invoiceId,
    });
    return false;
  }
}

/**
 * Suspend customer service
 */
export async function suspendService(data: SuspendServiceData): Promise<void> {
  const activityContext = Context.current();

  logger.info('Suspending customer service', {
    activityId: activityContext.info.activityId,
    customerId: data.customerId,
    gracePeriodDays: data.gracePeriodDays,
  });

  try {
    // Update customer status to suspended
    await prisma.customers.update({
      where: { id: data.customerId },
      data: {
        status: 'suspended',
      },
    });

    logger.info('Customer service suspended', {
      customerId: data.customerId,
      invoiceId: data.invoiceId,
    });

    // Send suspension notification email
    const customer = await prisma.customers.findUnique({
      where: { id: data.customerId },
    });

    if (customer) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });

      await transporter.sendMail({
        from: `"Quantum Billing" <${process.env.SMTP_FROM}>`,
        to: customer.email,
        subject: 'Service Suspension Notice',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc3545;">Service Suspension Notice</h2>

            <p>Dear ${customer.name},</p>

            <p>Due to overdue payment, your service has been suspended effective immediately.</p>

            <p>You have a grace period of <strong>${data.gracePeriodDays} days</strong> to settle your outstanding balance before your account is cancelled.</p>

            <p>Please contact our billing department immediately to resolve this matter.</p>

            <p>Best regards,<br>
            Billing Department<br>
            Quantum Billing</p>
          </div>
        `,
      });
    }

  } catch (error) {
    logger.error('Failed to suspend service', {
      error: error instanceof Error ? error.message : String(error),
      customerId: data.customerId,
    });
    throw error;
  }
}

/**
 * Cancel customer subscription
 */
export async function cancelSubscription(data: CancelSubscriptionData): Promise<void> {
  const activityContext = Context.current();

  logger.info('Cancelling customer subscription', {
    activityId: activityContext.info.activityId,
    customerId: data.customerId,
    reason: data.reason,
  });

  try {
    // Update customer status to cancelled
    await prisma.customers.update({
      where: { id: data.customerId },
      data: {
        status: 'churned',
      },
    });

    logger.info('Customer subscription cancelled', {
      customerId: data.customerId,
      invoiceId: data.invoiceId,
    });

    // Send cancellation notification email
    const customer = await prisma.customers.findUnique({
      where: { id: data.customerId },
    });

    if (customer) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });

      await transporter.sendMail({
        from: `"Quantum Billing" <${process.env.SMTP_FROM}>`,
        to: customer.email,
        subject: 'Account Cancellation Notice',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc3545;">Account Cancellation Notice</h2>

            <p>Dear ${customer.name},</p>

            <p>Your account has been cancelled due to non-payment.</p>

            <p>Reason: ${data.reason}</p>

            <p>If you believe this is an error or wish to restore your account, please contact our billing department immediately.</p>

            <p>Best regards,<br>
            Billing Department<br>
            Quantum Billing</p>
          </div>
        `,
      });
    }

  } catch (error) {
    logger.error('Failed to cancel subscription', {
      error: error instanceof Error ? error.message : String(error),
      customerId: data.customerId,
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