const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '&connection_limit=1'
    }
  }
});

const DEFAULT_ORG_ID = 'b86756c3-5f8c-45ac-9479-5095bd84aa27';

async function seedUsageLimits() {
  try {
    console.log('🌱 Starting usage limits seeding...');

    // Check if organization exists
    const org = await prisma.organizations.findUnique({
      where: { id: DEFAULT_ORG_ID }
    });

    if (!org) {
      console.error('❌ Organization not found:', DEFAULT_ORG_ID);
      return;
    }

    console.log('✅ Organization found:', org.name);

    // Get existing products
    let products = await prisma.products.findMany({
      where: { org_id: DEFAULT_ORG_ID },
      take: 5
    });

    console.log(`📦 Found ${products.length} products`);

    // Create sample products if none exist
    if (products.length === 0) {
      console.log('Creating sample products...');
      const sampleProducts = [
        { name: 'Starter Plan', description: 'Basic plan for small teams', base_price: 29.99 },
        { name: 'Professional Plan', description: 'For growing businesses', base_price: 99.99 },
        { name: 'Enterprise Plan', description: 'Unlimited resources', base_price: 299.99 },
        { name: 'API Access', description: 'API usage tier', base_price: 49.99 },
        { name: 'Storage Plan', description: 'Cloud storage service', base_price: 19.99 },
      ];

      for (const prod of sampleProducts) {
        const product = await prisma.products.create({
          data: {
            org_id: DEFAULT_ORG_ID,
            name: prod.name,
            description: prod.description,
            base_price: prod.base_price,
            status: 'active'
          }
        });
        products.push(product);
        console.log(`  ✓ Created product: ${product.name}`);
      }
    }

    // Get existing meters
    let meters = await prisma.meters.findMany({
      where: { org_id: DEFAULT_ORG_ID },
      take: 5
    });

    console.log(`📊 Found ${meters.length} meters`);

    // Create sample meters if none exist
    if (meters.length === 0) {
      console.log('Creating sample meters...');
      const sampleMeters = [
        { name: 'API Calls', event_type: 'api.call', aggregation: 'count', field: 'requests' },
        { name: 'Storage Used', event_type: 'storage.usage', aggregation: 'sum', field: 'bytes' },
        { name: 'Users Active', event_type: 'user.active', aggregation: 'unique', field: 'user_id' },
        { name: 'Compute Hours', event_type: 'compute.usage', aggregation: 'sum', field: 'hours' },
        { name: 'Bandwidth', event_type: 'bandwidth.transfer', aggregation: 'sum', field: 'megabytes' },
      ];

      for (const met of sampleMeters) {
        const meter = await prisma.meters.create({
          data: {
            org_id: DEFAULT_ORG_ID,
            name: met.name,
            event_type: met.event_type,
            aggregation: met.aggregation,
            field: met.field,
            status: 'active'
          }
        });
        meters.push(meter);
        console.log(`  ✓ Created meter: ${meter.name}`);
      }
    }

    // Create usage limits (product + meter combinations)
    console.log('\n📝 Creating usage limits...');

    const limitTypes = ['hard', 'soft', 'tiered'];
    const periods = ['monthly', 'daily', 'yearly'];
    
    const usageLimitsData = [
      {
        product_id: products[0].id,
        meter_id: meters[0].id,
        limit_type: 'hard',
        limit_value: 10000,
        period: 'monthly',
        warning_threshold_pct: 80,
        status: 'active'
      },
      {
        product_id: products[0].id,
        meter_id: meters[1].id,
        limit_type: 'soft',
        limit_value: 50000000000, // 50GB in bytes
        period: 'monthly',
        warning_threshold_pct: 90,
        status: 'active'
      },
      {
        product_id: products[1].id,
        meter_id: meters[0].id,
        limit_type: 'hard',
        limit_value: 100000,
        period: 'monthly',
        warning_threshold_pct: 85,
        status: 'active'
      },
      {
        product_id: products[1].id,
        meter_id: meters[2].id,
        limit_type: 'soft',
        limit_value: 50,
        period: 'monthly',
        warning_threshold_pct: 80,
        status: 'active'
      },
      {
        product_id: products[2].id,
        meter_id: meters[0].id,
        limit_type: 'tiered',
        limit_value: 1000000,
        period: 'monthly',
        warning_threshold_pct: 90,
        status: 'active'
      },
      {
        product_id: products[2].id,
        meter_id: meters[3].id,
        limit_type: 'hard',
        limit_value: 10000,
        period: 'monthly',
        warning_threshold_pct: 85,
        status: 'active'
      },
      {
        product_id: products[3].id,
        meter_id: meters[0].id,
        limit_type: 'hard',
        limit_value: 50000,
        period: 'monthly',
        warning_threshold_pct: 80,
        status: 'active'
      },
      {
        product_id: products[4].id,
        meter_id: meters[1].id,
        limit_type: 'soft',
        limit_value: 100000000000, // 100GB
        period: 'monthly',
        warning_threshold_pct: 85,
        status: 'active'
      },
    ];

    let created = 0;
    let skipped = 0;

    for (const limitData of usageLimitsData) {
      try {
        const existing = await prisma.usage_limits.findFirst({
          where: {
            product_id: limitData.product_id,
            meter_id: limitData.meter_id
          }
        });

        if (existing) {
          console.log(`  ⏭ Skipped (already exists): Product ${limitData.product_id.slice(0, 8)}... + Meter ${limitData.meter_id.slice(0, 8)}...`);
          skipped++;
          continue;
        }

        const usageLimit = await prisma.usage_limits.create({
          data: limitData,
          include: {
            products: { select: { name: true } },
            meters: { select: { name: true } }
          }
        });

        console.log(`  ✓ Created: ${usageLimit.products.name} - ${usageLimit.meters.name} (${usageLimit.limit_value} ${usageLimit.period})`);
        created++;
      } catch (error) {
        console.error(`  ❌ Error creating usage limit:`, error.message);
      }
    }

    console.log('\n✅ Usage limits seeding completed!');
    console.log(`   Created: ${created}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${created + skipped}`);

  } catch (error) {
    console.error('❌ Error seeding usage limits:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedUsageLimits();
