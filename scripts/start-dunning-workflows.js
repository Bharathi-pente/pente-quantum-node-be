#!/usr/bin/env node

/**
 * Start Dunning Workflows for Overdue Invoices
 *
 * This script checks for all overdue invoices and starts dunning workflows
 * Run: node scripts/start-dunning-workflows.js
 */

require('dotenv').config();
const path = require('path');

// Import the compiled service (or use ts-node for dev)
async function startDunningWorkflows() {
  console.log('Starting dunning workflow checker...\n');

  try {
    // Load TypeScript file using ts-node in development
    if (process.env.NODE_ENV !== 'production') {
      require('ts-node/register');
      const { dunningSchedulerService } = require('../src/services/dunning.scheduler.service');
      
      console.log('Checking for overdue invoices and starting workflows...\n');
      await dunningSchedulerService.processOverdueInvoices();
      console.log('\nDunning workflow check completed!');
      
    } else {
      // In production, use compiled JS
      const { dunningSchedulerService } = require('../dist/services/dunning.scheduler.service');
      
      console.log('Checking for overdue invoices and starting workflows...\n');
      await dunningSchedulerService.processOverdueInvoices();
      console.log('\nDunning workflow check completed!');
    }

    process.exit(0);

  } catch (error) {
    console.error('Failed to start dunning workflows:', error.message);
    console.error(error);
    process.exit(1);
  }
}

startDunningWorkflows();
