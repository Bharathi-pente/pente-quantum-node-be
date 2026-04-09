const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

dotenv.config();

async function checkOrganizations() {
  const prisma = new PrismaClient();

  try {
    const orgs = await prisma.organizations.findMany({
      select: { id: true, name: true, settings: true }
    });

    console.log('Organizations:');
    orgs.forEach(org => {
      console.log(`- ${org.name} (ID: ${org.id}) - Lago ID: ${org.settings?.lago_customer_id || 'Not set'}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrganizations();