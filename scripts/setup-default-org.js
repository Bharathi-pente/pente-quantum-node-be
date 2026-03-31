/**
 * Setup Default Organization
 * Run: node scripts/setup-default-org.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupDefaultOrg() {
  try {
    console.log('🏢 Setting up default organization...\n');

    const orgId = process.env.DEFAULT_ORG_ID || 'b86756c3-5f8c-45ac-9479-5095bd84aa27';

    // Check if organization exists
    const existing = await prisma.organizations.findUnique({
      where: { id: orgId },
    });

    if (existing) {
      console.log('✅ Organization already exists:');
      console.log(`   ID: ${existing.id}`);
      console.log(`   Name: ${existing.name}`);
      console.log(`   Status: ${existing.status}\n`);
      process.exit(0);
    }

    // Create organization
    const org = await prisma.organizations.create({
      data: {
        id: orgId,
        name: 'Acme Corporation',
        slug: 'acme-corp',
        billing_email: 'admin@acme.com',
        status: 'active',
        settings: {},
      },
    });

    console.log('✅ Organization created successfully!');
    console.log(`   ID: ${org.id}`);
    console.log(`   Name: ${org.name}`);
    console.log(`   Status: ${org.status}`);
    console.log(`   Billing Email: ${org.billing_email}\n`);

    // Optionally create default user (commented out - add manually if needed)
    /*
    const user = await prisma.users.create({
      data: {
        org_id: org.id,
        email: 'admin@acme.com',
        name: 'Acme Admin',
        status: 'active',
      },
    });

    console.log('✅ Default admin user created:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}\n`);
    */

    console.log('════════════════════════════════════════');
    console.log('✨ Setup complete!');
    console.log('   You can now create meters in the UI');
    console.log('════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupDefaultOrg();
