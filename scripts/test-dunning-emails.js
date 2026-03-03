#!/usr/bin/env node

/**
 * Test Dunning Workflow Email Sending
 *
 * This script demonstrates how to test if dunning policies are sending emails
 */

require('dotenv').config();
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api/v1';
const TEST_INVOICE_ID = 'INV-2026-001'; // From our check
const TEST_POLICY_ID = '70000000-0000-0000-0000-000000000001'; // Standard Dunning policy

async function testDunningWorkflow() {
  console.log('🚀 Testing Dunning Workflow Email Sending\n');

  try {
    // Step 1: Check if services are running
    console.log('1. Checking if backend is running...');
    const healthCheck = await axios.get(`${API_BASE}/health`);
    console.log('✅ Backend is running\n');

    // Step 2: Get invoice details
    console.log('2. Getting invoice details...');
    const invoices = await axios.get(`${API_BASE}/dunning/overdue-invoices`, {
      headers: { Authorization: 'Bearer test-token' } // You'll need a real token
    });
    const testInvoice = invoices.data.data.find(inv => inv.invoice_number === TEST_INVOICE_ID);

    if (!testInvoice) {
      console.log('❌ Test invoice not found in overdue list');
      return;
    }

    console.log(`✅ Found overdue invoice: ${testInvoice.invoice_number}`);
    console.log(`   Customer: ${testInvoice.customer_email}`);
    console.log(`   Amount: $${testInvoice.total_amount}\n`);

    // Step 3: Start dunning workflow
    console.log('3. Starting dunning workflow...');
    const workflowData = {
      invoiceId: testInvoice.id,
      policyId: TEST_POLICY_ID,
      customerId: testInvoice.customer_id,
      customerEmail: testInvoice.customer_email,
      customerName: testInvoice.customer_name || 'Valued Customer',
      invoiceNumber: testInvoice.invoice_number,
      amount: testInvoice.total_amount,
      dueDate: testInvoice.due_date
    };

    const workflowResponse = await axios.post(`${API_BASE}/dunning/workflows/start`, workflowData, {
      headers: { Authorization: 'Bearer test-token' }
    });

    const workflowId = workflowResponse.data.data.workflowId;
    console.log(`✅ Workflow started with ID: ${workflowId}\n`);

    // Step 4: Monitor workflow status
    console.log('4. Monitoring workflow execution...');
    console.log('   (This may take a few moments as Temporal processes the workflow)\n');

    let attempts = 0;
    const maxAttempts = 30; // 30 seconds

    while (attempts < maxAttempts) {
      try {
        const statusResponse = await axios.get(`${API_BASE}/dunning/workflows/${workflowId}/query`, {
          headers: { Authorization: 'Bearer test-token' }
        });

        const status = statusResponse.data.data;
        console.log(`   Status: ${status.currentStep || 'Initializing'} | Step: ${status.stepNumber || 0} | Paused: ${status.isPaused || false}`);

        if (status.lastEmailSent) {
          console.log(`   📧 Last email sent: ${status.lastEmailSent}`);
        }

        if (status.workflowStatus === 'COMPLETED' || status.workflowStatus === 'FAILED') {
          break;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      } catch (error) {
        console.log(`   Attempt ${attempts + 1}: Workflow not yet available, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }
    }

    console.log('\n5. Checking logs for email activity...');
    console.log('   Check the backend logs for messages like:');
    console.log('   - "Sending dunning email"');
    console.log('   - "Dunning email sent successfully"');
    console.log('   - Message IDs and recipient information\n');

    console.log('6. Manual verification steps:');
    console.log('   - Check your email inbox for dunning emails');
    console.log('   - Check Brevo/Sendinblue dashboard for sent emails');
    console.log('   - Monitor Temporal Web UI for workflow execution');
    console.log('   - Check database for updated dunning_step values\n');

    console.log('7. Test completed! 🎉');
    console.log(`   Workflow ID: ${workflowId}`);
    console.log('   If emails were sent, you should see them in your inbox within a few minutes.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);

    if (error.response?.status === 401) {
      console.log('\n🔑 Authentication required!');
      console.log('You need to get a valid JWT token. Try:');
      console.log('1. Login via the frontend');
      console.log('2. Use the token from browser dev tools');
      console.log('3. Or set BYPASS_AUTH=true in .env for testing');
    }

    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔌 Backend not running!');
      console.log('Start the backend with: npm run dev');
    }
  }
}

// Instructions
console.log('📧 DUNNING EMAIL TESTING GUIDE\n');
console.log('This script will help you verify that dunning policies are sending emails.\n');
console.log('PREREQUISITES:');
console.log('1. Backend running: npm run dev');
console.log('2. Temporal server running: docker run -p 7233:7233 temporalio/auto-setup:latest');
console.log('3. Temporal worker running: npm run dev:temporal');
console.log('4. Valid JWT token (or BYPASS_AUTH=true in .env)\n');

// Run the test if called directly
if (require.main === module) {
  testDunningWorkflow();
}

module.exports = { testDunningWorkflow };