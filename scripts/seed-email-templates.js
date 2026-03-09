#!/usr/bin/env node

/**
 * Seed Email Templates Script
 * Populates the database with default email templates for dunning
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const emailTemplates = [
  {
    name: 'Payment Reminder',
    template_id: 'payment_reminder',
    subject: 'Payment Reminder: Invoice Due',
    html_content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Reminder</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #2563eb;">Payment Reminder</h2>

    <p>Dear {{customer_name}},</p>

    <p>This is a reminder that your invoice <strong>{{invoice_number}}</strong> for <strong>\${{amount}}</strong> is due on {{due_date}}.</p>

    <p>Please ensure payment is made by the due date to avoid any service interruptions.</p>

    <div style="background: #f8fafc; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0;">
      <strong>Invoice Details:</strong><br>
      Invoice: {{invoice_number}}<br>
      Amount Due: \${{amount}}<br>
      Due Date: {{due_date}}
    </div>

    <p>You can make your payment by logging into your account or contacting our billing team.</p>

    <p>Best regards,<br>
    QuantumBilling Team</p>
  </div>
</body>
</html>`,
    text_content: `Dear {{customer_name}},

This is a reminder that your invoice {{invoice_number}} for \${{amount}} is due on {{due_date}}.

Please ensure payment is made by the due date to avoid any service interruptions.

Invoice Details:
Invoice: {{invoice_number}}
Amount Due: ${{amount}}
Due Date: {{due_date}}

You can make your payment by logging into your account or contacting our billing team.

Best regards,
QuantumBilling Team`,
    variables: ['customer_name', 'invoice_number', 'amount', 'due_date'],
    used_in: 2,
  },
  {
    name: 'First Overdue Notice',
    template_id: 'payment_overdue_1',
    subject: 'Payment Overdue: Action Required',
    html_content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>First Overdue Notice</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #dc2626;">Payment Overdue Notice</h2>

    <p>Dear {{customer_name}},</p>

    <p>Your payment for invoice <strong>{{invoice_number}}</strong> is now overdue. The amount due is <strong>${{amount}}</strong>.</p>

    <p>Please remit payment immediately to avoid additional fees and potential service suspension.</p>

    <div style="background: #fef2f2; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0;">
      <strong>Overdue Invoice Details:</strong><br>
      Invoice: {{invoice_number}}<br>
      Amount Due: ${{amount}}<br>
      Days Overdue: {{days_overdue}}
    </div>

    <p>If you have already made payment, please disregard this notice. Otherwise, please contact us immediately.</p>

    <p>Best regards,<br>
    QuantumBilling Team</p>
  </div>
</body>
</html>`,
    text_content: `Dear {{customer_name}},

Your payment for invoice {{invoice_number}} is now overdue. The amount due is ${{amount}}.

Please remit payment immediately to avoid additional fees and potential service suspension.

Overdue Invoice Details:
Invoice: {{invoice_number}}
Amount Due: ${{amount}}
Days Overdue: {{days_overdue}}

If you have already made payment, please disregard this notice. Otherwise, please contact us immediately.

Best regards,
QuantumBilling Team`,
    variables: ['customer_name', 'invoice_number', 'amount', 'days_overdue'],
    used_in: 2,
  },
  {
    name: 'Second Overdue Notice',
    template_id: 'payment_overdue_2',
    subject: 'Urgent: Payment Still Outstanding',
    html_content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Second Overdue Notice</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #dc2626;">URGENT: Payment Still Outstanding</h2>

    <p>Dear {{customer_name}},</p>

    <p>This is your second notice regarding the overdue payment for invoice <strong>{{invoice_number}}</strong> in the amount of <strong>${{amount}}</strong>.</p>

    <p>Immediate payment is required to prevent service suspension.</p>

    <div style="background: #fef2f2; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0;">
      <strong>Outstanding Invoice:</strong><br>
      Invoice: {{invoice_number}}<br>
      Amount Due: ${{amount}}<br>
      Days Overdue: {{days_overdue}}
    </div>

    <p>Please contact us immediately if you need assistance with payment arrangements.</p>

    <p>Best regards,<br>
    QuantumBilling Team</p>
  </div>
</body>
</html>`,
    text_content: `Dear {{customer_name}},

This is your second notice regarding the overdue payment for invoice {{invoice_number}} in the amount of ${{amount}}.

Immediate payment is required to prevent service suspension.

Outstanding Invoice:
Invoice: {{invoice_number}}
Amount Due: ${{amount}}
Days Overdue: {{days_overdue}}

Please contact us immediately if you need assistance with payment arrangements.

Best regards,
QuantumBilling Team`,
    variables: ['customer_name', 'invoice_number', 'amount', 'days_overdue'],
    used_in: 1,
  },
  {
    name: 'Final Notice',
    template_id: 'final_notice',
    subject: 'Final Notice: Service Suspension Warning',
    html_content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Final Notice</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #dc2626;">FINAL NOTICE: Service Suspension Warning</h2>

    <p>Dear {{customer_name}},</p>

    <p>This is your final notice regarding the overdue payment for invoice <strong>{{invoice_number}}</strong> in the amount of <strong>${{amount}}</strong>.</p>

    <p>If payment is not received within 7 days, your service will be suspended.</p>

    <div style="background: #fef2f2; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0;">
      <strong>Final Notice Details:</strong><br>
      Invoice: {{invoice_number}}<br>
      Amount Due: ${{amount}}<br>
      Payment Due By: {{payment_due_date}}
    </div>

    <p>Please make payment immediately to avoid service interruption.</p>

    <p>Best regards,<br>
    QuantumBilling Team</p>
  </div>
</body>
</html>`,
    text_content: `Dear {{customer_name}},

This is your final notice regarding the overdue payment for invoice {{invoice_number}} in the amount of ${{amount}}.

If payment is not received within 7 days, your service will be suspended.

Final Notice Details:
Invoice: {{invoice_number}}
Amount Due: ${{amount}}
Payment Due By: {{payment_due_date}}

Please make payment immediately to avoid service interruption.

Best regards,
QuantumBilling Team`,
    variables: ['customer_name', 'invoice_number', 'amount', 'payment_due_date'],
    used_in: 1,
  },
  {
    name: 'Payment Received',
    template_id: 'payment_received',
    subject: 'Thank You - Payment Received',
    html_content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Received</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #059669;">Payment Received - Thank You</h2>

    <p>Dear {{customer_name}},</p>

    <p>Thank you for your payment of <strong>${{amount}}</strong> for invoice <strong>{{invoice_number}}</strong>. Your payment has been processed successfully.</p>

    <div style="background: #f0fdf4; padding: 15px; border-left: 4px solid #059669; margin: 20px 0;">
      <strong>Payment Details:</strong><br>
      Invoice: {{invoice_number}}<br>
      Amount Paid: ${{amount}}<br>
      Payment Date: {{payment_date}}
    </div>

    <p>Your account is now up to date. Thank you for your business!</p>

    <p>Best regards,<br>
    QuantumBilling Team</p>
  </div>
</body>
</html>`,
    text_content: `Dear {{customer_name}},

Thank you for your payment of ${{amount}} for invoice {{invoice_number}}. Your payment has been processed successfully.

Payment Details:
Invoice: {{invoice_number}}
Amount Paid: ${{amount}}
Payment Date: {{payment_date}}

Your account is now up to date. Thank you for your business!

Best regards,
QuantumBilling Team`,
    variables: ['customer_name', 'invoice_number', 'amount', 'payment_date'],
    used_in: 0,
  },
];

async function seedEmailTemplates() {
  console.log('🌱 Seeding email templates...');

  try {
    for (const template of emailTemplates) {
      const existing = await prisma.email_templates.findUnique({
        where: { template_id: template.template_id },
      });

      if (!existing) {
        await prisma.email_templates.create({
          data: {
            ...template,
            org_id: '11111111-1111-1111-1111-111111111111', // Use the correct org_id
          },
        });
        console.log(`✓ Created template: ${template.name}`);
      } else {
        console.log(`⚠ Template already exists: ${template.name}`);
      }
    }

    console.log('✅ Email templates seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding email templates:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedEmailTemplates();