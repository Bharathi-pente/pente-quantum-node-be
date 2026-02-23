#!/usr/bin/env node

/**
 * QuantumBilling Backend - Setup Script
 * This script helps you get started quickly
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function execute(command, description) {
  log(`\n${description}...`, colors.blue);
  try {
    execSync(command, { stdio: 'inherit' });
    log(`✓ ${description} - Success!`, colors.green);
    return true;
  } catch (error) {
    log(`✗ ${description} - Failed!`, colors.red);
    return false;
  }
}

function checkFile(filePath, name) {
  if (fs.existsSync(filePath)) {
    log(`✓ ${name} exists`, colors.green);
    return true;
  } else {
    log(`✗ ${name} not found`, colors.red);
    return false;
  }
}

async function main() {
  log('\n╔═══════════════════════════════════════════════╗', colors.blue);
  log('║  QuantumBilling Backend - Setup Script       ║', colors.blue);
  log('╚═══════════════════════════════════════════════╝\n', colors.blue);

  // Step 1: Check .env
  log('Step 1: Checking environment configuration...', colors.yellow);
  checkFile('.env', '.env file');

  // Step 2: Check node_modules
  log('\nStep 2: Checking dependencies...', colors.yellow);
  if (!fs.existsSync('node_modules')) {
    execute('npm install', 'Installing dependencies');
  } else {
    log('✓ node_modules already exists', colors.green);
  }

  // Step 3: Prisma introspection
  log('\nStep 3: Setting up database schema...', colors.yellow);
  if (!fs.existsSync('prisma/migrations') || !fs.readdirSync('prisma').includes('schema.prisma')) {
    execute('npx prisma db pull', 'Introspecting database schema');
  } else {
    log('✓ Prisma schema appears to be configured', colors.green);
  }

  // Step 4: Generate Prisma Client
  log('\nStep 4: Generating Prisma Client...', colors.yellow);
  execute('npx prisma generate', 'Generating Prisma Client');

  // Step 5: Build TypeScript
  log('\nStep 5: Building TypeScript...', colors.yellow);
  execute('npm run build', 'Compiling TypeScript');

  // Summary
  log('\n╔═══════════════════════════════════════════════╗', colors.green);
  log('║            Setup Complete! 🎉                 ║', colors.green);
  log('╚═══════════════════════════════════════════════╝', colors.green);
  
  log('\nYou can now start the server with:', colors.yellow);
  log('  npm run dev', colors.blue);
  log('\nAPI Documentation will be available at:', colors.yellow);
  log('  http://localhost:3000/api-docs', colors.blue);
  log('\nHealth Check:', colors.yellow);
  log('  http://localhost:3000/api/v1/health', colors.blue);
  log('\nPrisma Studio (Database GUI):', colors.yellow);
  log('  npm run prisma:studio', colors.blue);
  log('\n');
}

main().catch(console.error);
