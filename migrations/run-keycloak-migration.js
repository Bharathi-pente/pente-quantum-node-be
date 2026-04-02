const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function runMigrations() {
  try {
    console.log('🔄 Starting Keycloak link migration...');

    // Add keycloak_user_id column
    console.log('Adding keycloak_user_id column...');
    await prisma.$executeRaw`ALTER TABLE users ADD COLUMN IF NOT EXISTS keycloak_user_id UUID`;

    // Add keycloak_roles column
    console.log('Adding keycloak_roles column...');
    await prisma.$executeRaw`ALTER TABLE users ADD COLUMN IF NOT EXISTS keycloak_roles JSONB DEFAULT '[]'::jsonb`;

    // Make org_id nullable for super admins
    console.log('Making org_id nullable...');
    await prisma.$executeRaw`ALTER TABLE users ALTER COLUMN org_id DROP NOT NULL`;

    // Create indexes
    console.log('Creating indexes...');
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_users_keycloak_id ON users(keycloak_user_id)`;

    // Add comments
    console.log('Adding column comments...');
    await prisma.$executeRaw`COMMENT ON COLUMN users.keycloak_user_id IS 'UUID from Keycloak sub claim (JWT token). Used for SSO integration.'`;
    await prisma.$executeRaw`COMMENT ON COLUMN users.keycloak_roles IS 'Cached Keycloak client roles for quick access.'`;
    await prisma.$executeRaw`COMMENT ON COLUMN users.org_id IS 'Organization ID. NULL for super admins who can access all orgs.'`;

    console.log('✅ Keycloak link migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigrations();