import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed Script for QuantumBilling Platform
 * Creates realistic data for admin dashboard metrics
 * 
 * Run with: npx prisma db seed
 */

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log('🗑️  Clearing existing data...');
  await prisma.alert_history.deleteMany();
 await prisma.customers.deleteMany();
  await prisma.users.deleteMany();
  await prisma.organizations.deleteMany();
  console.log('✅ Existing data cleared\n');

  // Create Organizations
  console.log('🏢 Creating organizations...');
  const organizations = await Promise.all([
    prisma.organizations.create({
      data: {
        id: 'b86756c3-5f8c-45ac-9479-5095bd84aa27',
        name: 'Acme Corporation',
        status: 'active',
        email: 'admin@acme.com',
        phone: '+1-555-0100',
        address: '123 Business St, San Francisco, CA 94105',
        created_at: new Date('2025-01-15'),
      },
    }),
    prisma.organizations.create({
      data: {
        name: 'TechStart Inc',
        status: 'active',
        email: 'contact@techstart.io',
        phone: '+1-555-0101',
        address: '456 Innovation Ave, Austin, TX 78701',
        created_at: new Date('2025-02-01'),
      },
    }),
    prisma.organizations.create({
      data: {
        name: 'Global Enterprises',
        status: 'active',
        email: 'info@globalent.com',
        phone: '+1-555-0102',
        address: '789 Enterprise Blvd, New York, NY 10001',
        created_at: new Date('2025-02-15'),
      },
    }),
    prisma.organizations.create({
      data: {
        name: 'StartupCo',
        status: 'trial',
        email: 'team@startupco.com',
        phone: '+1-555-0103',
        address: '321 Venture Way, Seattle, WA 98101',
        created_at: new Date('2026-03-01'),
      },
    }),
    prisma.organizations.create({
      data: {
        name: 'MegaCorp',
        status: 'inactive',
        email: 'billing@megacorp.com',
        phone: '+1-555-0104',
        address: '654 Corporate Dr, Chicago, IL 60601',
        created_at: new Date('2024-12-01'),
        status_changed_at: new Date('2026-02-01'),
      },
    }),
  ]);
  console.log(`✅ Created ${organizations.length} organizations\n`);

  // Create Users for each organization
  console.log('👥 Creating users...');
  const users = [];
  for (const org of organizations.slice(0, 4)) {
    // Only active and trial orgs
    const orgUsers = await Promise.all([
      prisma.users.create({
        data: {
          org_id: org.id,
          email: `admin@${org.name.toLowerCase().replace(/\s+/g, '')}.com`,
          name: `${org.name} Admin`,
          role: 'admin',
          status: 'active',
          created_at: org.created_at,
        },
      }),
      prisma.users.create({
        data: {
          org_id: org.id,
          email: `user1@${org.name.toLowerCase().replace(/\s+/g, '')}.com`,
          name: `${org.name} User 1`,
          role: 'user',
          status: 'active',
          created_at: new Date(org.created_at.getTime() + 86400000), // +1 day
        },
      }),
      prisma.users.create({
        data: {
          org_id: org.id,
          email: `user2@${org.name.toLowerCase().replace(/\s+/g, '')}.com`,
          name: `${org.name} User 2`,
          role: 'user',
          status: 'active',
          created_at: new Date(org.created_at.getTime() + 172800000), // +2 days
        },
      }),
    ]);
    users.push(...orgUsers);
  }
  console.log(`✅ Created ${users.length} users\n`);

  // Create Customers with varying MRR
  console.log('💼 Creating customers with MRR data...');
  const customers = [];
  
  // Acme Corp customers (high MRR)
  for (let i = 0; i < 15; i++) {
    const customer = await prisma.customers.create({
      data: {
        org_id: organizations[0].id,
        name: `Acme Customer ${i + 1}`,
        email: `customer${i + 1}@acme-clients.com`,
        status: i < 12 ? 'active' : 'trial',
        mrr: i < 12 ? (Math.random() * 5000 + 1000) : null, // $1,000 - $6,000
        billing_cycle: 'monthly',
        currency: 'USD',
        credit_balance: 0,
        created_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Last 90 days
      },
    });
    customers.push(customer);
  }

  // TechStart customers (medium MRR)
  for (let i = 0; i < 10; i++) {
    const customer = await prisma.customers.create({
      data: {
        org_id: organizations[1].id,
        name: `TechStart Client ${i + 1}`,
        email: `client${i + 1}@techstart-users.com`,
        status: i < 8 ? 'active' : 'trial',
        mrr: i < 8 ? (Math.random() * 3000 + 500) : null, // $500 - $3,500
        billing_cycle: 'monthly',
        currency: 'USD',
        credit_balance: Math.random() * 100,
        created_at: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000), // Last 60 days
      },
    });
    customers.push(customer);
  }

  // Global Enterprises customers (high MRR)
  for (let i = 0; i < 12; i++) {
    const customer = await prisma.customers.create({
      data: {
        org_id: organizations[2].id,
        name: `Global Client ${i + 1}`,
        email: `client${i + 1}@global-accounts.com`,
        status: i < 10 ? 'active' : 'trial',
        mrr: i < 10 ? (Math.random() * 8000 + 2000) : null, // $2,000 - $10,000
        billing_cycle: i % 2 === 0 ? 'monthly' : 'annual',
        currency: 'USD',
        credit_balance: Math.random() * 500,
        created_at: new Date(Date.now() - Math.random() * 75 * 24 * 60 * 60 * 1000), // Last 75 days
      },
    });
    customers.push(customer);
  }

  // StartupCo customers (low MRR - trial org)
  for (let i = 0; i < 5; i++) {
    const customer = await prisma.customers.create({
      data: {
        org_id: organizations[3].id,
        name: `Startup Customer ${i + 1}`,
        email: `customer${i + 1}@startup-trials.com`,
        status: 'trial',
        mrr: null,
        billing_cycle: 'monthly',
        currency: 'USD',
        credit_balance: 0,
        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Last 30 days
      },
    });
    customers.push(customer);
  }

  console.log(`✅ Created ${customers.length} customers\n`);

  // Calculate total MRR
  const totalMRR = customers.reduce((sum, c) => sum + (Number(c.mrr) || 0), 0);
  console.log(`📊 Total Platform MRR: $${totalMRR.toLocaleString()}\n`);

  // Create Alert Channels
  console.log('📢 Creating alert channels...');
  const channels = await Promise.all(
    organizations.slice(0, 3).map((org, idx) =>
      prisma.alert_channels.create({
        data: {
          org_id: org.id,
          name: `${org.name} Email Channel`,
          channel_type: 'email',
          config: {
            recipients: [`alerts@${org.name.toLowerCase().replace(/\s+/g, '')}.com`],
          },
          status: 'active',
        },
      }),
    ),
  );
  console.log(`✅ Created ${channels.length} alert channels\n`);

  // Create Events (Alert History) for metrics
  console.log('📊 Creating event data (alert history)...');
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const events = [];

  // Create alerts first
  const alerts = await Promise.all(
    organizations.slice(0, 3).map((org) =>
      prisma.alerts.create({
        data: {
          org_id: org.id,
          name: `${org.name} MRR Alert`,
          alert_type: 'revenue',
          condition_expr: 'mrr > threshold',
          threshold: 10000,
          status: 'active',
          trigger_count: 0,
        },
      }),
    ),
  );

  // Generate events over the last 30 days
  for (const alert of alerts) {
    const eventCount = Math.floor(Math.random() * 50) + 20; // 20-70 events per alert
    
    for (let i = 0; i < eventCount; i++) {
      const triggeredAt = new Date(
        thirtyDaysAgo + Math.random() * (now - thirtyDaysAgo),
      );
      
      const event = await prisma.alert_history.create({
        data: {
          alert_id: alert.id,
          channel_id: channels.find((c) => c.org_id === alert.org_id)?.id,
          triggered_at: triggeredAt,
          value_snapshot: `$${(Math.random() * 15000 + 5000).toFixed(2)}`,
          delivery_status: Math.random() > 0.1 ? 'delivered' : 'failed',
        },
      });
      events.push(event);
    }
  }

  console.log(`✅ Created ${events.length} events in last 30 days\n`);

  // Summary
console.log('════════════════════════════════════════');
  console.log('✨ SEED COMPLETED SUCCESSFULLY!');
  console.log('════════════════════════════════════════\n');
  console.log('📊 Summary:');
  console.log(`   • Organizations: ${organizations.length}`);
  console.log(`   • Users: ${users.length}`);
  console.log(`   • Customers: ${customers.length}`);
  console.log(`   • Active Customers: ${customers.filter((c) => c.status === 'active').length}`);
  console.log(`   • Trial Customers: ${customers.filter((c) => c.status === 'trial').length}`);
  console.log(`   • Total Platform MRR: $${totalMRR.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  console.log(`   • Alert Channels: ${channels.length}`);
  console.log(`   • Events (30d): ${events.length}`);
  console.log('\n════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
