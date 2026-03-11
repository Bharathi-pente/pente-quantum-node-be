const path = require('path');
const prisma = require(path.join(__dirname, 'src/config/database')).default;

async function checkDunningPolicies() {
  try {
    console.log('Checking dunning policies and their templates...\n');

    const policies = await prisma.dunning_policies.findMany({
      include: {
        dunning_steps: {
          orderBy: { sort_order: 'asc' }
        }
      }
    });

    console.log(`Found ${policies.length} dunning policies:\n`);

    policies.forEach((policy, index) => {
      console.log(`${index + 1}. ${policy.name} (ID: ${policy.id})`);
      console.log(`   Status: ${policy.status}, Default: ${policy.is_default}`);
      console.log(`   Steps: ${policy.dunning_steps?.length || 0}`);

      policy.dunning_steps?.forEach((step) => {
        console.log(`     Step ${step.sort_order}: ${step.action} on Day ${step.day_offset}`);
        console.log(`       Template: ${step.template_name || 'NONE - will use default email'}`);
        console.log(`       Subject: ${step.subject || 'Default subject'}`);
      });

      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error checking policies:', error);
    process.exit(1);
  }
}

checkDunningPolicies();