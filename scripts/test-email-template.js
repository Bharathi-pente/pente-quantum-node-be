const path = require('path');
const { sendDunningEmailInternal } = require(path.join(__dirname, 'src/activities/dunning.activities'));

async function testEmailTemplate() {
  console.log('Testing email template rendering...\n');

  try {
    await sendDunningEmailInternal({
      to: 'test@example.com',
      customerName: 'John Doe',
      invoiceNumber: 'INV-2026-001',
      amount: 150.00,
      dueDate: new Date('2026-03-15'),
      stepNumber: 1,
      templateName: 'payment_reminders',
      subject: 'Test Payment Reminder',
      orgId: 'd25fd5c6-21c1-4e53-af82-6fcd790f3336',
      customerId: 'test-customer-id',
      invoiceId: 'test-invoice-id',
    });

    console.log('✅ Email sent successfully! Check your inbox for the rendered template.');
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
  }
}

testEmailTemplate();