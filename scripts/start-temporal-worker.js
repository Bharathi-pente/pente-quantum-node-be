#!/usr/bin/env node

/**
 * Development script to start the Temporal dunning worker
 *
 * Usage: npm run dev:worker
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('Starting Temporal Dunning Worker in development mode...');

// Start the worker with ts-node for development
const workerProcess = spawn('node', [
  './node_modules/.bin/ts-node.cmd',
  path.join(__dirname, '../src/workers/dunning.worker.ts')
], {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..'), // Run from backend root directory
  env: {
    ...process.env,
    NODE_ENV: 'development',
  }
});

workerProcess.on('close', (code) => {
  console.log(`Temporal worker exited with code ${code}`);
  process.exit(code);
});

workerProcess.on('error', (error) => {
  console.error('Failed to start Temporal worker:', error);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down Temporal worker...');
  workerProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('Shutting down Temporal worker...');
  workerProcess.kill('SIGTERM');
});