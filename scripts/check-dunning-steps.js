const path = require('path');
const prisma = require(path.join(__dirname, 'src/config/database')).default;

async function checkDunningSteps() {
  try {
    console.log('Checking dunning steps and their template references...\n');

    const steps = await prisma.dunning_steps.findMany({
      include: {
        dunning_policies: { select: { name: true } }
      }
    });

    console.log(`Found ${steps.length} dunning steps:\n`);

    steps.forEach((step, index) => {
      console.log(`${index + 1}. Policy: ${step.dunning_policies?.name}`);
      console.log(`   Step ${step.sort_order}: template_name = "${step.template_name}"`);
      console.log(`   Day offset: ${step.day_offset}, Email enabled: ${step.email_enabled}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error checking dunning steps:', error);
    process.exit(1);
  }
}

checkDunningSteps();