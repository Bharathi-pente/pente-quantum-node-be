#!/usr/bin/env node

/**
 * This script was used to seed sample audit logs.
 * Real-time audit logging is now implemented throughout the application.
 *
 * Audit logs are automatically created when:
 * - Users log in (success/failure)
 * - Customers are created
 * - Invoices are created
 * - Payments are processed
 *
 * See src/utils/audit-logger.ts for the audit logging implementation.
 */

console.log('Real-time audit logging is now active. No sample data seeding needed.');

const sampleAuditLogs = [
  {
    org_id: '550e8400-e29b-41d4-a716-446655440000', // Will be replaced with actual org ID
    actor: 'sarah@acme.ai',
    actor_name: 'Sarah Chen',
    action: 'customer.created',
    resource_label: 'TechCorp AI',
    resource_id: null, // Use null for non-UUID resource IDs
    ip_address: '192.168.1.45',
    user_agent: 'Chrome/120.0',
    status: 'success',
    details: { plan: 'Enterprise', mrr: 48500 },
    created_at: new Date('2024-12-26T14:32:15Z'),
  },
  {
    org_id: '550e8400-e29b-41d4-a716-446655440000',
    actor: 'mike@acme.ai',
    actor_name: 'Mike Johnson',
    action: 'invoice.sent',
    resource_label: 'INV-2024-12-001',
    resource_id: null,
    ip_address: '192.168.1.52',
    user_agent: 'Chrome/120.0',
    status: 'success',
    details: { amount: 47415, customer: 'TechCorp AI' },
    created_at: new Date('2024-12-26T14:28:03Z'),
  },
  {
    org_id: '550e8400-e29b-41d4-a716-446655440000',
    actor: 'system',
    actor_name: 'System',
    action: 'payment.processed',
    resource_label: 'PAY-2024-12-001',
    resource_id: null,
    ip_address: null, // Use null for internal/system actions
    user_agent: 'QuantumBill/1.0',
    status: 'success',
    details: { amount: 47415, method: 'card' },
    created_at: new Date('2024-12-26T14:15:42Z'),
  },
  {
    org_id: '550e8400-e29b-41d4-a716-446655440000',
    actor: 'sarah@acme.ai',
    actor_name: 'Sarah Chen',
    action: 'pricing.updated',
    resource_label: 'GPT-4 Input',
    resource_id: null,
    ip_address: '192.168.1.45',
    user_agent: 'Chrome/120.0',
    status: 'success',
    details: { oldPrice: 0.00003, newPrice: 0.000025 },
    created_at: new Date('2024-12-26T13:45:18Z'),
  },
  {
    org_id: '550e8400-e29b-41d4-a716-446655440000',
    actor: 'emily@acme.ai',
    actor_name: 'Emily Davis',
    action: 'report.exported',
    resource_label: 'Revenue Report Q4',
    resource_id: null,
    ip_address: '192.168.1.78',
    user_agent: 'Firefox/121.0',
    status: 'success',
    details: { format: 'PDF', rows: 1247 },
    created_at: new Date('2024-12-26T13:30:55Z'),
  },
  {
    org_id: '550e8400-e29b-41d4-a716-446655440000',
    actor: 'james@acme.ai',
    actor_name: 'James Wilson',
    action: 'user.login',
    resource_label: 'james@acme.ai',
    resource_id: null,
    ip_address: '203.45.67.89',
    user_agent: 'Safari/17.0',
    status: 'success',
    details: { method: 'SSO' },
    created_at: new Date('2024-12-26T12:18:33Z'),
  },
  {
    org_id: '550e8400-e29b-41d4-a716-446655440000',
    actor: 'unknown',
    actor_name: 'Unknown',
    action: 'user.login',
    resource_label: 'admin@acme.ai',
    resource_id: null,
    ip_address: '45.123.45.67',
    user_agent: 'curl/7.81.0',
    status: 'failed',
    details: { reason: 'Invalid credentials', attempts: 3 },
    created_at: new Date('2024-12-26T11:55:12Z'),
  },
  {
    org_id: '550e8400-e29b-41d4-a716-446655440000',
    actor: 'sarah@acme.ai',
    actor_name: 'Sarah Chen',
    action: 'credits.granted',
    resource_label: 'TechCorp AI',
    resource_id: null,
    ip_address: '192.168.1.45',
    user_agent: 'Chrome/120.0',
    status: 'success',
    details: { amount: 5000, type: 'promotional' },
    created_at: new Date('2024-12-26T11:42:08Z'),
  },
  {
    org_id: '550e8400-e29b-41d4-a716-446655440000',
    actor: 'api_key_prod',
    actor_name: 'API Key (Production)',
    action: 'event.ingested',
    resource_label: 'Batch Import',
    resource_id: null,
    ip_address: '10.0.0.55',
    user_agent: 'QuantumBill-SDK/2.4.1',
    status: 'success',
    details: { events: 15420, duration: '2.3s' },
    created_at: new Date('2024-12-26T10:30:22Z'),
  },
  {
    org_id: '550e8400-e29b-41d4-a716-446655440000',
    actor: 'system',
    actor_name: 'System',
    action: 'invoice.generated',
    resource_label: 'INV-2024-12-002',
    resource_id: null,
    ip_address: null, // Use null for internal/system actions
    user_agent: 'QuantumBill/1.0',
    status: 'success',
    details: { customer: 'DataFlow Systems', amount: 12208 },
    created_at: new Date('2024-12-26T09:15:44Z'),
  },
];

async function seedAuditLogs() {
  try {
    console.log('🌱 Seeding audit logs...');

    // Get the first organization to use as org_id
    const org = await prisma.organizations.findFirst();
    if (!org) {
      console.error('❌ No organizations found. Please create an organization first.');
      process.exit(1);
    }

    // Update sample data with actual org_id
    const auditLogsWithOrgId = sampleAuditLogs.map(log => ({
      ...log,
      org_id: org.id,
    }));

    // Clear existing audit logs
    await prisma.audit_logs.deleteMany();

    // Insert sample audit logs
    for (const auditLog of auditLogsWithOrgId) {
      await prisma.audit_logs.create({
        data: auditLog,
      });
    }

    console.log(`✅ Successfully seeded ${auditLogsWithOrgId.length} audit logs`);

  } catch (error) {
    console.error('❌ Error seeding audit logs:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedAuditLogs();