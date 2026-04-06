/**
 * Temporal Worker for Dunning Workflows
 *
 * This worker executes dunning workflows and activities
 */

import { Worker } from '@temporalio/worker';
import { NativeConnection } from '@temporalio/worker';
import * as activities from '../activities/dunning.activities';

async function runWorker() {
  try {
    console.log('Connecting to Temporal server at:', process.env.TEMPORAL_ADDRESS || 'localhost:7233');
    
    // Create connection to Temporal gRPC endpoint
    const connection = await NativeConnection.connect({
      address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
      // TLS is disabled for local/AWS development setup
      tls: false,
    });

    console.log('Connected to Temporal server successfully!');

    // Create worker with the configured connection
    const worker = await Worker.create({
      connection,
      workflowsPath: require.resolve('../workflows/dunning.workflow'),
      activities,
      taskQueue: 'dunning-queue',
      namespace: process.env.TEMPORAL_NAMESPACE || 'default',
    });

    console.log('Temporal worker created for namespace:', process.env.TEMPORAL_NAMESPACE || 'default');
    console.log('Task queue:', 'dunning-queue');
    console.log('View workflows at:', process.env.TEMPORAL_WEB_UI || 'http://localhost:8081');
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