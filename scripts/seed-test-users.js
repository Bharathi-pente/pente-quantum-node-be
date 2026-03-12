const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DEFAULT_ORG_ID = 'b86756c3-5f8c-45ac-9479-5095bd84aa27';

async function seedTestUsers() {
  try {
    console.log('🌱 Seeding test users...');

    // Check if organization exists
    const org = await prisma.organizations.findUnique({
      where: { id: DEFAULT_ORG_ID },
    });

    if (!org) {
      console.error(`❌ Organization with ID ${DEFAULT_ORG_ID} not found`);
      process.exit(1);
    }

    console.log(`✓ Found organization: ${org.name}`);

    // Get roles
    const roles = await prisma.roles.findMany({
      where: { org_id: DEFAULT_ORG_ID },
    });

    if (roles.length === 0) {
      console.error('❌ No roles found. Please run seed-roles.js first');
      process.exit(1);
    }

    console.log(`✓ Found ${roles.length} roles`);

    // Test users to create
    const testUsers = [
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'Admin',
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        role: 'Developer',
      },
      {
        name: 'Bob Johnson',
        email: 'bob.johnson@example.com',
        role: 'Viewer',
      },
    ];

    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await prisma.users.findUnique({
        where: { email: userData.email },
      });

      if (existingUser) {
        console.log(`⏭️  User "${userData.email}" already exists, skipping...`);
        continue;
      }

      // Find role
      const role = roles.find((r) => r.name === userData.role);
      if (!role) {
        console.log(`⚠️  Role "${userData.role}" not found for user ${userData.name}`);
        continue;
      }

      // Generate avatar initials
      const avatar_initials = userData.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);

      // Create user
      const user = await prisma.users.create({
        data: {
          name: userData.name,
          email: userData.email,
          org_id: DEFAULT_ORG_ID,
          role_id: role.id,
          status: 'active',
          avatar_initials,
        },
        include: {
          roles: {
            select: {
              name: true,
            },
          },
        },
      });

      console.log(`✓ Created user: ${user.name} (${user.email}) - Role: ${user.roles.name}`);
    }

    console.log('');
    console.log('✅ Test users seeded successfully!');
    console.log('');
    console.log('You can now view these users at:');
    console.log('  - http://localhost:5173/admin/settings (Users tab)');
    console.log('  - http://localhost:5173/portal/team');
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedTestUsers();
