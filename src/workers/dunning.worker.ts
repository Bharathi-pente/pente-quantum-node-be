/**
 * Temporal Worker for Dunning Workflows
 *
 * This worker executes dunning workflows and activities
 */

import { Worker } from '@temporalio/worker';
import * as activities from '../activities/dunning.activities';

async function runWorker() {
  try {
    // Create worker
    const worker = await Worker.create({
      workflowsPath: require.resolve('../workflows/dunning.workflow'),
      activities,
      taskQueue: 'dunning-queue',
    });

    console.log('Starting Temporal worker for dunning workflows...');

    // Start the worker
    await worker.run();

  } catch (error) {
    console.error('Failed to start Temporal worker:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down Temporal worker...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down Temporal worker...');
  process.exit(0);
});

// Start the worker
runWorker().catch((error) => {
  console.error('Worker failed to start:', error);
  process.exit(1);
});