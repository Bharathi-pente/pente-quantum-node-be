import app from './app';
import logger from './config/logger';
import prisma from './config/database';
import { dunningSchedulerService } from './services/dunning.scheduler.service';

// Port
const PORT = parseInt(process.env.PORT || '5000', 10);
const HOST = process.env.HOST || '0.0.0.0'; // Bind to all interfaces for Docker/EC2

// Start server
const server = app.listen(PORT, HOST, () => {
  logger.info(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   QuantumBilling API Server                              ║
  ║   Environment: ${process.env.NODE_ENV?.padEnd(42) || 'development'.padEnd(42)}║
  ║   Server: http://${HOST}:${PORT.toString().padEnd(31)}║
  ║   API Docs: http://localhost:${PORT}/api-docs${' '.repeat(19)}║
  ║   Health Check: http://localhost:${PORT}/api/v1/health${' '.repeat(11)}║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
  `);

  // Start dunning scheduler if enabled
  if (process.env.ENABLE_DUNNING_SCHEDULER === 'true') {
    const intervalMinutes = parseInt(process.env.DUNNING_SCHEDULER_INTERVAL || '60');
    logger.info(`Starting automatic dunning scheduler (interval: ${intervalMinutes} minutes)`);
    dunningSchedulerService.startScheduler(intervalMinutes);
  } else {
    logger.info('Automatic dunning scheduler is disabled. Set ENABLE_DUNNING_SCHEDULER=true to enable.');
  }
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`\n${signal} received. Starting graceful shutdown...`);
  
  server.close(async () => {
    logger.info('HTTP server closed');
    
    try {
      await prisma.$disconnect();
      logger.info('Database connection closed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

export default server;
