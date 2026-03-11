const path = require('path');
const emailTemplateService = require(path.join(__dirname, 'src/services/email-template.service')).default;

async function testTemplateRendering() {
  console.log('🔄 Testing email template rendering...\n');

  try {
    console.log('📝 Calling renderTemplate with variables...');
    const rendered = await emailTemplateService.renderTemplate(
      'payment_reminders',
      'd25fd5c6-21c1-4e53-af82-6fcd790f3336',
      {
        customer_name: 'John Doe',
        invoice_number: 'INV-2026-001',
        amount: '150.00',
        due_date: 'March 15, 2026',
        step_number: 1,
      }
    );

    console.log('✅ Template rendered successfully!');
    console.log('\n--- RENDERED SUBJECT ---');
    console.log(rendered.subject);
    console.log('\n--- RENDERED HTML (first 500 chars) ---');
    console.log(rendered.html.substring(0, 500) + '...');
    console.log('\n--- RENDERED TEXT (first 300 chars) ---');
    console.log(rendered.text?.substring(0, 300) + '...' || 'No text content');

  } catch (error) {
    console.error('❌ Error rendering template:', error.message);
    console.error('Stack:', error.stack);
  }

  process.exit(0);
}

testTemplateRendering();