const path = require('path');
const prisma = require(path.join(__dirname, 'src/config/database')).default;

async function fixTemplateNames() {
  console.log('🔧 Fixing template name mismatches in dunning policies...\n');

  try {
    // Fix payment_reminder -> payment_reminders
    const result1 = await prisma.dunning_steps.updateMany({
      where: { template_name: 'payment_reminder' },
      data: { template_name: 'payment_reminders' }
    });
    console.log(`✅ Updated ${result1.count} steps: 'payment_reminder' → 'payment_reminders'`);

    // Check for any other mismatches
    const allSteps = await prisma.dunning_steps.findMany({
      where: { template_name: { not: null } },
      select: { template_name: true }
    });

    const uniqueTemplates = [...new Set(allSteps.map(s => s.template_name))];
    console.log('\n📋 Template names used in policies:', uniqueTemplates);

    // Check which templates exist
    const existingTemplates = await prisma.email_templates.findMany({
      select: { template_id: true, name: true }
    });

    const existingIds = existingTemplates.map(t => t.template_id);
    console.log('📋 Available templates:', existingIds);

    // Find mismatches
    const mismatches = uniqueTemplates.filter(t => t && !existingIds.includes(t));
    if (mismatches.length > 0) {
      console.log('\n⚠️  Still found mismatches:', mismatches);
    } else {
      console.log('\n✅ All template references are now valid!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing templates:', error);
    process.exit(1);
  }
}

fixTemplateNames();