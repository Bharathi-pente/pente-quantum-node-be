#!/usr/bin/env node

/**
 * Check for overdue invoices in the database
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function checkInvoices() {
  const prisma = new PrismaClient();

  try {
    console.log('Checking for overdue invoices...\n');

    const overdueInvoices = await prisma.invoices.findMany({
      where: {
        status: 'pending',
        due_date: {
          lt: new Date()
        }
      },
      include: {
        customers: true
      },
      take: 5
    });

    console.log(`Found ${overdueInvoices.length} overdue invoices:\n`);

    if (overdueInvoices.length === 0) {
      console.log('No overdue invoices found.');
      console.log('You may need to create test data or update existing invoices to be overdue.');
      console.log('\nTo create test data, you can:');
      console.log('1. Update an existing invoice due_date to a past date');
      console.log('2. Create a new overdue invoice via the API');
      console.log('3. Use the frontend to create test invoices');
      return;
    }

    overdueInvoices.forEach((inv, index) => {
      console.log(`${index + 1}. Invoice: ${inv.invoice_number}`);
      console.log(`   Customer: ${inv.customers?.email || 'No email'}`);
      console.log(`   Due Date: ${inv.due_date.toISOString().split('T')[0]}`);
      console.log(`   Amount: $${inv.total_amount}`);
      console.log(`   Status: ${inv.status}`);
      console.log('');
    });

    console.log('You can use any of these invoices to test the dunning workflow.');

  } catch (error) {
    console.error('Error checking invoices:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkInvoices();