const path = require('path');
const prisma = require(path.join(__dirname, 'src/config/database')).default;

async function checkTemplateContent() {
  try {
    console.log('Checking payment_reminders template content...\n');

    const template = await prisma.email_templates.findFirst({
      where: { template_id: 'payment_reminders' }
    });

    if (!template) {
      console.log('Template not found');
      process.exit(1);
    }

    console.log('Template:', template.name);
    console.log('Subject:', template.subject);
    console.log('\n--- HTML Content (first 500 chars) ---');
    console.log(template.html_content.substring(0, 500));
    console.log('\n--- TEXT Content ---');
    console.log(template.text_content);

    // Check for literal \n strings
    const hasLiteralBackslashN = template.html_content.includes('\\n');
    console.log('\n--- Analysis ---');
    console.log('Contains literal \\n strings:', hasLiteralBackslashN);
    console.log('Contains actual newlines:', /\n/.test(template.html_content));

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTemplateContent();