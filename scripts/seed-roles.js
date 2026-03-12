const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DEFAULT_ORG_ID = 'b86756c3-5f8c-45ac-9479-5095bd84aa27';

const defaultRoles = [
  {
    name: 'Admin',
    description: 'Full administrative access',
    permissions: [
      'users:read',
      'users:write',
      'users:delete',
      'billing:read',
      'billing:write',
      'settings:read',
      'settings:write',
    ],
  },
  {
    name: 'Developer',
    description: 'Developer access with API and usage permissions',
    permissions: [
      'users:read',
      'api:read',
      'api:write',
      'usage:read',
    ],
  },
  {
    name: 'Viewer',
    description: 'Read-only access',
    permissions: [
      'users:read',
      'usage:read',
      'billing:read',
    ],
  },
  {
    name: 'Billing',
    description: 'Billing and payment management',
    permissions: [
      'billing:read',
      'billing:write',
      'usage:read',
    ],
  },
];

async function seedRoles() {
  try {
    console.log('🌱 Seeding default roles...');

    // Check if organization exists
    const org = await prisma.organizations.findUnique({
      where: { id: DEFAULT_ORG_ID },
    });

    if (!org) {
      console.error(`❌ Organization with ID ${DEFAULT_ORG_ID} not found`);
      console.log('Please update the DEFAULT_ORG_ID in this script with a valid organization ID');
      process.exit(1);
    }

    console.log(`✓ Found organization: ${org.name}`);

    for (const roleData of defaultRoles) {
      // Check if role already exists
      const existingRole = await prisma.roles.findUnique({
        where: {
          org_id_name: {
            org_id: DEFAULT_ORG_ID,
            name: roleData.name,
          },
        },
      });

      if (existingRole) {
        console.log(`⏭️  Role "${roleData.name}" already exists, skipping...`);
        continue;
      }

      // Create role
      const role = await prisma.roles.create({
        data: {
          org_id: DEFAULT_ORG_ID,
          name: roleData.name,
          description: roleData.description,
          role_permissions: {
            create: roleData.permissions.map((permission) => ({
              permission,
            })),
          },
        },
        include: {
          role_permissions: true,
        },
      });

      console.log(`✓ Created role: ${role.name} with ${role.role_permissions.length} permissions`);
    }

    console.log('');
    console.log('✅ Default roles seeded successfully!');
    console.log('');
    console.log('You can now create users with these roles from the admin settings page.');
  } catch (error) {
    console.error('❌ Error seeding roles:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedRoles();
