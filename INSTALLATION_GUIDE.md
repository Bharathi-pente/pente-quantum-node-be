# Installation Guide - Medium Priority Improvements

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- **Redis server running** (required for caching and job queues)

## Step 1: Install Redis

### Windows:
```powershell
# Download and install from: https://github.com/microsoftarchive/redis/releases
# Or use WSL2:
wsl --install
wsl
sudo apt update
sudo apt install redis-server
sudo service redis-server start
```

### macOS:
```bash
brew install redis
brew services start redis
```

### Linux:
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

### Test Redis:
```bash
redis-cli ping
# Should respond: PONG
```

## Step 2: Install Dependencies

```bash
npm install
```

This will install all new dependencies including:
- `bullmq` - Job queue system
- `ioredis` - Redis client
- `dataloader` - Batch loading pattern
- `reflect-metadata` - Decorator metadata
- `jest`, `ts-jest`, `@types/jest` - Testing framework
- `supertest`, `@types/supertest` - API testing
- `pm2` - Process management

## Step 3: Update Environment Variables

Add to your `.env` file:

```bash
# Redis Configuration (required)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Cache Settings
CACHE_ENABLED=true

# Node Environment
NODE_ENV=development
PORT=3000

# Existing variables...
DATABASE_URL=postgresql://user:password@localhost:5432/quantumbilling
JWT_SECRET=your-secret-key
```

## Step 4: Build TypeScript

```bash
npm run build
```

## Step 5: Run Tests (Optional)

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Step 6: Start the Application

### Development Mode:

```bash
# Terminal 1: Start API server
npm run dev

# Terminal 2: Start background workers
npm run dev:workers
```

### Production Mode:

```bash
# Build application
npm run build

# Start with PM2 (recommended)
pm2 start ecosystem.config.js --env production

# Or start manually
npm start                    # API server
npm run start:workers        # Background workers
```

## Verification

### 1. Check API Server
```bash
curl http://localhost:3000/api/v1/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "..."
}
```

### 2. Check Redis Connection
```bash
redis-cli
> KEYS *
```

### 3. Check PM2 Processes (if using PM2)
```bash
pm2 status
```

Should show:
```
┌─────┬────────────────────────┬─────────┬─────────┬─────────┐
│ id  │ name                   │ status  │ cpu     │ memory  │
├─────┼────────────────────────┼─────────┼─────────┼─────────┤
│ 0   │ quantumbilling-api     │ online  │ 0%      │ 50.0mb  │
│ 1   │ quantumbilling-workers │ online  │ 0%      │ 45.0mb  │
└─────┴────────────────────────┴─────────┴─────────┴─────────┘
```

### 4. Test Caching
```bash
# First request (cache miss)
curl -i http://localhost:3000/api/v1/customers/some-id

# Look for header:
# X-Cache: MISS

# Second request (cache hit)
curl -i http://localhost:3000/api/v1/customers/some-id

# Look for header:
# X-Cache: HIT
```

## Troubleshooting

### Issue: "Cannot find module 'bullmq'"

**Solution:**
```bash
npm install bullmq ioredis dataloader reflect-metadata
```

### Issue: "Redis connection failed"

**Solution:**
1. Ensure Redis is running:
   ```bash
   redis-cli ping
   ```
2. Check Redis host/port in `.env`
3. Check if Redis requires password

### Issue: "Tests failing"

**Solution:**
```bash
# Install test dependencies
npm install --save-dev jest ts-jest @types/jest supertest @types/supertest

# Run tests with verbose output
npm test -- --verbose
```

### Issue: "PM2 command not found"

**Solution:**
```bash
# Install PM2 globally
npm install -g pm2

# Or use npx
npx pm2 start ecosystem.config.js
```

### Issue: TypeScript compilation errors

**Solution:**
```bash
# Clean build
rm -rf dist node_modules package-lock.json
npm install
npm run build
```

## What's Next?

After successful installation:

1. ✅ API server running on port 3000
2. ✅ Background workers processing jobs
3. ✅ Redis caching active
4. ✅ Tests passing
5. ✅ PM2 managing processes

Now you can:
- Add more unit tests for your services
- Implement integration tests for your API endpoints
- Monitor performance with PM2 monitoring
- Scale horizontally by adding more worker instances
- Optimize cache TTLs based on your usage patterns

## Documentation

- [Medium Priority Guide](./MEDIUM_PRIORITY_GUIDE.md) - Detailed feature documentation
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md) - High-priority improvements
- [Customer API Docs](./CUSTOMER_API_DOCS.md) - API reference

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review logs: `pm2 logs` or check `logs/` directory
3. Verify all environment variables are set
4. Ensure Redis and PostgreSQL are running

## Quick Commands Reference

```bash
# Development
npm run dev                   # Start API (hot reload)
npm run dev:workers           # Start workers (hot reload)

# Production (PM2)
pm2 start ecosystem.config.js # Start all processes
pm2 stop all                  # Stop all processes
pm2 restart all               # Restart all processes
pm2 logs                      # View logs
pm2 monit                     # Monitor resources

# Testing
npm test                      # Run all tests
npm run test:watch            # Watch mode
npm run test:unit             # Unit tests only
npm run test:integration      # Integration tests only

# Database
npm run prisma:studio         # Open Prisma Studio
npm run prisma:generate       # Generate Prisma Client
npm run db:check              # Check database connection

# Build
npm run build                 # Compile TypeScript
npm start                     # Start production server
```
