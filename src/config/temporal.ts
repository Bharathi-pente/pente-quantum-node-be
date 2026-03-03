/**
 * Temporal Client Configuration
 *
 * Configures connection to Temporal server for workflow orchestration
 */

import { Connection, Client } from '@temporalio/client';

export async function createTemporalClient(): Promise<Client> {
  // Connect to Temporal server
  const connection = await Connection.connect({
    address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
    // TLS configuration if needed
    tls: process.env.TEMPORAL_TLS === 'true' ? {} : false,
  });

  // Create and return client
  const client = new Client({
    connection,
    namespace: process.env.TEMPORAL_NAMESPACE || 'default',
  });

  return client;
}

export const TEMPORAL_CONFIG = {
  address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
  namespace: process.env.TEMPORAL_NAMESPACE || 'default',
  taskQueue: 'dunning-queue',
};