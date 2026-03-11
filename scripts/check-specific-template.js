const path = require('path');
const prisma = require(path.join(__dirname, 'src/config/database')).default;

async function checkSpecificTemplate() {
  try {
    console.log('Checking specific email template...\n');

    const template = await prisma.email_templates.findFirst({
      where: { template_id: 'payment_reminders' },
    });

    if (!template) {
      console.log('Template not found');
      return;
    }

    console.log('Template Details:');
    console.log(`Name: ${template.name}`);
    console.log(`Template ID: ${template.template_id}`);
    console.log(`Subject: ${template.subject}`);
    console.log(`Variables: ${template.variables?.join(', ') || 'none'}`);
    console.log('\nHTML Content:');
    console.log(template.html_content);
    console.log('\nText Content:');
    console.log(template.text_content);

    process.exit(0);
  } catch (error) {
    console.error('Error checking template:', error);
    process.exit(1);
  }
}

checkSpecificTemplate();