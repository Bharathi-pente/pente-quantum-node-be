import { PrismaClient } from '@prisma/client';
import logger from './logger';

// Add connection pool parameters to the DATABASE_URL if not already present
const getDatabaseUrl = () => {
  const baseUrl = process.env.DATABASE_URL || '';
  
  // Check if connection pool params already exist
  if (baseUrl.includes('connection_limit') || baseUrl.includes('pool_timeout')) {
    return baseUrl;
  }
  
  // Add connection pool parameters
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}connection_limit=5&pool_timeout=10`;
};

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
});

// Handle Prisma connection errors
prisma.$connect()
  .then(() => {
    logger.info('✓ Database connected successfully');
  })
  .catch((error) => {
    logger.error('✗ Database connection failed:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  logger.info('Database connection closed');
});

export default prisma;
