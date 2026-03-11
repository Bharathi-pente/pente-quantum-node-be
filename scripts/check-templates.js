const path = require('path');
const prisma = require(path.join(__dirname, 'src/config/database')).default;

async function checkEmailTemplates() {
  try {
    console.log('Checking email templates...\n');

    const templates = await prisma.email_templates.findMany({
      include: {
        organizations: true
      }
    });

    console.log(`Found ${templates.length} email templates:\n`);

    templates.forEach((template, index) => {
      console.log(`${index + 1}. ${template.name}`);
      console.log(`   ID: ${template.id}`);
      console.log(`   Template ID: ${template.template_id}`);
      console.log(`   Subject: ${template.subject}`);
      console.log(`   Org ID: ${template.org_id}`);
      console.log(`   HTML Content (first 200 chars): ${template.html_content?.substring(0, 200)}...`);
      console.log(`   Text Content (first 200 chars): ${template.text_content?.substring(0, 200)}...`);
      console.log(`   Variables: ${template.variables?.join(', ') || 'none'}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error checking templates:', error);
    process.exit(1);
  }
}

checkEmailTemplates();