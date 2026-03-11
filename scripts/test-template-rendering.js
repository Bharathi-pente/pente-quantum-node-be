const path = require('path');
const prisma = require(path.join(__dirname, 'src/config/database')).default;
const emailTemplateService = require(path.join(__dirname, 'src/services/email-template.service')).default;

async function testTemplateRendering() {
  try {
    console.log('🧪 Testing email template rendering with dunning policy data...\n');

    // Get a dunning policy with steps
    const policy = await prisma.dunning_policies.findFirst({
      include: {
        dunning_steps: {
          where: { template_name: { not: null } },
          orderBy: { sort_order: 'asc' }
        }
      }
    });

    if (!policy || policy.dunning_steps.length === 0) {
      console.log('❌ No dunning policies with email templates found');
      process.exit(1);
    }

    console.log(`📋 Testing policy: ${policy.name}`);
    console.log(`   Steps with templates: ${policy.dunning_steps.length}\n`);

    // Test data
    const testData = {
      customer_name: 'John Doe',
      invoice_number: 'INV-2026-001',
      amount: '150.00',
      due_date: 'March 15, 2026',
      step_number: '1'
    };

    // Test each step
    for (const step of policy.dunning_steps) {
      console.log(`\n📧 Step ${step.sort_order}: ${step.template_name}`);
      console.log(`   Day offset: ${step.day_offset} days after due date`);

      try {
        const result = await emailTemplateService.renderTemplate(
          step.template_name,
          policy.org_id,
          testData
        );

        if (result) {
          console.log(`   ✅ Template rendered successfully`);
          console.log(`   Subject: ${result.subject}`);
          console.log(`   Text preview: ${result.text.substring(0, 150)}...`);
          
          // Check if variables were replaced
          const hasUnreplacedVars = result.text.includes('{{') || result.html.includes('{{');
          if (hasUnreplacedVars) {
            console.log('   ⚠️  WARNING: Template still contains unreplaced variables!');
          } else {
            console.log('   ✅ All variables properly replaced');
          }
        } else {
          console.log('   ❌ Template rendering returned null');
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }

    console.log('\n✅ Template rendering test complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during test:', error);
    process.exit(1);
  }
}

testTemplateRendering();