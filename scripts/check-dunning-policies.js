#!/usr/bin/env node

/**
 * Check available dunning policies
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function checkPolicies() {
  const prisma = new PrismaClient();

  try {
    console.log('Checking available dunning policies...\n');

    const policies = await prisma.dunning_policies.findMany({
      include: {
        dunning_steps: {
          orderBy: { sort_order: 'asc' }
        }
      }
    });

    if (policies.length === 0) {
      console.log('No dunning policies found.');
      console.log('You need to create a dunning policy first via the API or frontend.');
      return;
    }

    console.log(`Found ${policies.length} dunning policies:\n`);

    policies.forEach((policy, index) => {
      console.log(`${index + 1}. ${policy.name} (ID: ${policy.id}) - ${policy.status}`);
      console.log(`   Description: ${policy.description || 'No description'}`);
      console.log(`   Steps: ${policy.dunning_steps.length}`);

      policy.dunning_steps.forEach(step => {
        console.log(`     - Day ${step.day_offset}: ${step.action}${step.template_name ? ` (${step.template_name})` : ''}`);
      });
      console.log('');
    });

    console.log('You can use any active policy to test dunning workflows.');

  } catch (error) {
    console.error('Error checking policies:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPolicies();