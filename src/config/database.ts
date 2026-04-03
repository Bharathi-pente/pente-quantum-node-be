import { PrismaClient } from '@prisma/client';
import logger from './logger';

// Connection pool configuration
const getConnectionPoolConfig = () => {
  const isDev = process.env.NODE_ENV === 'development';
  return {
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || (isDev ? '20' : '50')),
    poolTimeout: 30,
    connectTimeout: 10,
    socketTimeout: 10,
  };
};

// Add connection pool parameters to the DATABASE_URL if not already present
const getDatabaseUrl = () => {
  const baseUrl = process.env.DATABASE_URL || '';
  
  // If URL already has all params, use as-is
  if (baseUrl.includes('connection_limit') && baseUrl.includes('pool_timeout')) {
    return baseUrl;
  }
  
  // Add connection pool parameters
  const config = getConnectionPoolConfig();
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}connection_limit=${config.connectionLimit}&pool_timeout=${config.poolTimeout}&connect_timeout=${config.connectTimeout}&socket_timeout=${config.socketTimeout}`;
};

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ]
    : [
        { emit: 'event', level: 'error' },
      ],
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
});

// Log queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query' as never, (e: any) => {
    logger.debug(`Query: ${e.query} - Duration: ${e.duration}ms`);
  });
}

// Log errors
prisma.$on('error' as never, (e: any) => {
  logger.error('Prisma error:', e);
});

// Add connection retry logic
const connectWithRetry = async (retries = 5, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$connect();
      logger.info(`✓ Database connected successfully (Pool size: ${getConnectionPoolConfig().connectionLimit})`);
      
      // Log connection pool health periodically
      if (process.env.NODE_ENV === 'production') {
        setInterval(async () => {
          try {
            const start = Date.now();
            await prisma.$executeRaw`SELECT 1`;
            const duration = Date.now() - start;
            if (duration > 1000) {
              logger.warn(`Slow database health check: ${duration}ms`);
            }
          } catch (error) {
            logger.error('Database health check failed:', error);
          }
        }, 60000); // Every minute
      }
      
      return;
    } catch (error) {
      logger.warn(`Database connection attempt ${i + 1}/${retries} failed:`, error);
      if (i < retries - 1) {
        logger.info(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  logger.error('✗ Database connection failed after all retries');
  throw new Error('Failed to connect to database');
};

// Handle Prisma connection errors
connectWithRetry().catch((error) => {
  logger.error('Failed to initialize database connection:', error);
  process.exit(1);
});

// Graceful shutdown handlers
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Closing database connections...`);
  try {
    await prisma.$disconnect();
    logger.info('✓ Database connections closed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error during database disconnect:', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  logger.info('Database connection closed');
});

export default prisma;
