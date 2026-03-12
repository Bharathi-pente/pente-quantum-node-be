const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DEFAULT_ORG_ID = 'b86756c3-5f8c-45ac-9479-5095bd84aa27';

async function checkUsers() {
  try {
    console.log('\n🔍 Checking users in database...\n');
    
    const users = await prisma.users.findMany({
      where: { org_id: DEFAULT_ORG_ID },
      include: {
        roles: {
          select: {
            name: true,
          },
        },
      },
    });

    console.log(`Found ${users.length} users for org: ${DEFAULT_ORG_ID}\n`);

    if (users.length > 0) {
      console.log('Users:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email})`);
        console.log(`   - ID: ${user.id}`);
        console.log(`   - Role: ${user.roles.name}`);
        console.log(`   - Status: ${user.status}`);
        console.log(`   - Org ID: ${user.org_id}`);
        console.log('');
      });
    } else {
      console.log('❌ No users found!');
    }

    // Also check total users in database
    const totalUsers = await prisma.users.count();
    console.log(`\nTotal users in database (all orgs): ${totalUsers}`);

  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
