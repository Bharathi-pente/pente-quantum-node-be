const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function runOrganizationCreatedByMigration() {
  try {
    console.log('🔄 Starting organization created_by migration...');

    // Add created_by column
    console.log('Adding created_by column...');
    await prisma.$executeRaw`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS created_by UUID`;

    // Add foreign key constraint
    console.log('Adding foreign key constraint...');
    await prisma.$executeRaw`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'fk_organizations_created_by'
        ) THEN
          ALTER TABLE organizations
          ADD CONSTRAINT fk_organizations_created_by
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `;

    // Add index
    console.log('Creating index...');
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON organizations(created_by)`;

    // Add comment
    console.log('Adding column comment...');
    await prisma.$executeRaw`COMMENT ON COLUMN organizations.created_by IS 'Reference to the user who created this organization'`;

    console.log('✅ Organization created_by migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runOrganizationCreatedByMigration();