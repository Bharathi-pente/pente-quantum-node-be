/**
 * Worker Entry Point
 * 
 * Initialize all background workers
 */

import logger from '../config/logger';

// Import workers
import { invoiceWorker } from './invoice.worker';
import { reportWorker } from './report.worker';

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing workers...');
  await invoiceWorker.close();
  await reportWorker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing workers...');
  await invoiceWorker.close();
  await reportWorker.close();
  process.exit(0);
});

logger.info('✅ All workers initialized and running');
