# Docker Deployment Guide

## Overview

This project is fully containerized with Docker for consistent deployment across all environments. The Docker setup includes:

- ✅ **Multi-stage production build** - Optimized image size
- ✅ **Development hot-reloading** - Fast feedback loop
- ✅ **PostgreSQL database** - Persistent data storage
- ✅ **Redis caching** - Improved performance
- ✅ **Health checks** - Container monitoring
- ✅ **Non-root user** - Enhanced security

## Quick Start

### Production Deployment
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

### Development Mode
```bash
# Start with hot-reloading
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Run in background
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### With Database Management Tool
```bash
# Start with pgAdmin
docker-compose --profile tools up -d

# Access pgAdmin at http://localhost:5050
# Email: admin@quantum.local
# Password: admin
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Network                          │
│                                                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐          │
│  │  Backend   │  │ PostgreSQL │  │   Redis    │          │
│  │            │  │            │  │            │          │
│  │  Node.js   │──│   Port     │──│   Port     │          │
│  │  Port 3000 │  │   5432     │  │   6379     │          │
│  └────────────┘  └────────────┘  └────────────┘          │
│                                                             │
│  ┌────────────┐                                            │
│  │  pgAdmin   │  (Optional with --profile tools)          │
│  │  Port 5050 │                                            │
│  └────────────┘                                            │
└─────────────────────────────────────────────────────────────┘
```

## Docker Files

### Dockerfile (Production)
Multi-stage production build with 4 stages:
1. **Dependencies** - Install all dependencies
2. **Build** - Compile TypeScript and generate Prisma client
3. **Production Dependencies** - Install only production dependencies
4. **Runtime** - Minimal production image

**Image Size**: ~300MB (compared to ~1GB without optimization)

### Dockerfile.dev (Development)
Single-stage development build with:
- Hot-reloading via nodemon
- Source maps enabled
- All dev dependencies
- Debugging tools

### docker-compose.yml (Base)
Defines all services:
- Backend API
- PostgreSQL database
- Redis cache
- pgAdmin (optional)

### docker-compose.dev.yml (Development Override)
Extends base configuration with:
- Volume mounts for hot-reloading
- Development environment variables
- Debug logging enabled

### .dockerignore
Excludes unnecessary files from build context:
- node_modules
- logs
- .env files
- Documentation
- Test files

## Environment Variables

### Required Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@postgres:5432/quantum_billing

# Keycloak Authentication
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=quantum-billing

# CORS
CORS_ORIGIN=https://app.yourdomain.com
```

### Optional Variables
```bash
# Application
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your-secure-password

# Monitoring
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
```

### Setting Environment Variables

**Option 1: .env file**
```bash
# Create .env file (not committed to git)
cp .env.example .env
# Edit .env with your values
nano .env

# Docker Compose automatically loads .env
docker-compose up
```

**Option 2: Environment file**
```bash
# Create separate environment file
docker-compose --env-file .env.production up
```

**Option 3: Command line**
```bash
# Set inline
DATABASE_URL=postgres://... docker-compose up
```

**Option 4: Docker secrets (Production)**
```bash
# See Docker Secrets section below
```

## Common Commands

### Building

```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build backend

# Build with no cache
docker-compose build --no-cache

# Build production image
docker build -t quantum-billing-backend:latest .

# Build development image
docker build -f Dockerfile.dev -t quantum-billing-backend:dev .
```

### Running

```bash
# Start all services
docker-compose up

# Start in detached mode
docker-compose up -d

# Start specific service
docker-compose up backend

# Start with specific compose file
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### Viewing Logs

```bash
# All services
docker-compose logs

# Follow logs
docker-compose logs -f

# Specific service
docker-compose logs backend

# Last 100 lines
docker-compose logs --tail=100 backend

# Since timestamp
docker-compose logs --since 2024-01-01T10:00:00
```

### Managing Containers

```bash
# List running containers
docker-compose ps

# Stop all services
docker-compose stop

# Stop specific service
docker-compose stop backend

# Restart service
docker-compose restart backend

# Remove stopped containers
docker-compose rm

# Stop and remove containers
docker-compose down

# Remove containers and volumes
docker-compose down -v
```

### Database Operations

```bash
# Run Prisma migrations
docker-compose exec backend npx prisma migrate deploy

# Run Prisma Studio
docker-compose exec backend npx prisma studio

# Access PostgreSQL CLI
docker-compose exec postgres psql -U postgres quantum_billing

# Backup database
docker-compose exec postgres pg_dump -U postgres quantum_billing > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres quantum_billing < backup.sql
```

### Debugging

```bash
# Execute command in running container
docker-compose exec backend node -v

# Open shell in container
docker-compose exec backend sh

# View container resource usage
docker stats

# Inspect container
docker inspect quantum-billing-backend

# View container processes
docker-compose top backend
```

## Production Deployment

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- 2GB RAM minimum
- 10GB disk space

### Deployment Steps

**1. Clone Repository**
```bash
git clone https://github.com/your-org/quantum-billing-backend.git
cd quantum-billing-backend
```

**2. Configure Environment**
```bash
# Copy example environment file
cp .env.example .env

# Edit with production values
nano .env

# Secure the file
chmod 600 .env
```

**3. Build Image**
```bash
# Build production image
docker-compose build --no-cache
```

**4. Run Migrations**
```bash
# Start database
docker-compose up -d postgres

# Wait for database to be ready
docker-compose exec postgres pg_isready

# Run migrations
docker-compose exec backend npx prisma migrate deploy
```

**5. Start Services**
```bash
# Start all services
docker-compose up -d

# Verify health
docker-compose ps
```

**6. Verify Deployment**
```bash
# Check health endpoint
curl http://localhost:3000/api/v1/health

# View logs
docker-compose logs -f backend
```

### Production Checklist

- [ ] Environment variables configured
- [ ] Database password changed from default
- [ ] Redis password set
- [ ] CORS origins restricted to production domains
- [ ] Sentry DSN configured for error tracking
- [ ] SSL/TLS certificates configured
- [ ] Firewall rules configured
- [ ] Backup strategy implemented
- [ ] Monitoring alerts configured
- [ ] Load balancer configured (if applicable)

## Development Workflow

### Initial Setup
```bash
# Clone repository
git clone <repository-url>
cd backend

# Start development environment
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### Daily Development
```bash
# Start services
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# View logs
docker-compose logs -f backend

# Make code changes (hot-reload automatically applies)

# Run tests
docker-compose exec backend npm test

# Stop services
docker-compose down
```

### Database Changes
```bash
# Create migration
docker-compose exec backend npx prisma migrate dev --name add_new_field

# Reset database
docker-compose exec backend npx prisma migrate reset

# View database in Prisma Studio
docker-compose exec backend npx prisma studio
```

## Performance Optimization

### Image Size Optimization

**Before optimization**: ~1.2GB
**After optimization**: ~300MB

Techniques used:
- Multi-stage build
- Alpine base image
- Production dependencies only
- .dockerignore for build context

### Build Speed Optimization

```dockerfile
# Cache npm dependencies
COPY package*.json ./
RUN npm ci
# Then copy source code
COPY . .
```

### Runtime Optimization

```yaml
# Resource limits
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 512M
```

## Security Best Practices

### 1. Non-Root User
```dockerfile
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs
```

### 2. Minimal Base Image
```dockerfile
FROM node:20-alpine  # Instead of node:20
```

### 3. No Secrets in Image
```bash
# Never do this:
ENV SECRET_KEY=my-secret  # ❌

# Instead use secrets:
docker secret create db_password ./db_password.txt  # ✅
```

### 4. Read-Only Filesystem
```yaml
services:
  backend:
    read_only: true
    tmpfs:
      - /tmp
      - /app/logs
```

### 5. Security Scanning
```bash
# Scan image for vulnerabilities
docker scan quantum-billing-backend:latest

# Use Trivy
trivy image quantum-billing-backend:latest
```

## Docker Secrets (Production)

### Create Secrets
```bash
# Create secret from file
echo "super-secure-password" | docker secret create db_password -

# Create from stdin
docker secret create jwt_secret jwt_secret.txt
```

### Use Secrets in Compose
```yaml
version: '3.9'
services:
  backend:
    secrets:
      - db_password
      - jwt_secret
    environment:
      DATABASE_PASSWORD_FILE: /run/secrets/db_password
      JWT_SECRET_FILE: /run/secrets/jwt_secret

secrets:
  db_password:
    external: true
  jwt_secret:
    external: true
```

### Read Secrets in Application
```typescript
import fs from 'fs';

const secretPath = process.env.DATABASE_PASSWORD_FILE;
const password = fs.readFileSync(secretPath, 'utf8').trim();
```

## Monitoring & Health Checks

### Health Check Configuration
```yaml
healthcheck:
  test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/api/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### Check Health Status
```bash
# Via Docker
docker inspect --format='{{.State.Health.Status}}' quantum-billing-backend

# Via API
curl http://localhost:3000/api/v1/health
```

### View Health History
```bash
docker inspect quantum-billing-backend | jq '.[].State.Health'
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs backend

# Check last exit code
docker inspect --format='{{.State.ExitCode}}' quantum-billing-backend

# Check events
docker events --filter container=quantum-billing-backend
```

### Database Connection Issues

```bash
# Check if database is ready
docker-compose exec postgres pg_isready

# Test connection
docker-compose exec backend node -e "console.log(process.env.DATABASE_URL)"

# Check network
docker network inspect quantum-billing-network
```

### Performance Issues

```bash
# Check resource usage
docker stats

# View top processes
docker-compose top backend

# Check disk usage
docker system df
```

### Port Already in Use

```bash
# Find process using port
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Change port in docker-compose.yml
ports:
  - "3001:3000"  # Use different host port
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Docker Build & Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: docker build -t quantum-billing-backend .
      
      - name: Run tests
        run: docker run quantum-billing-backend npm test
      
      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push quantum-billing-backend
```

## Best Practices Summary

### DO ✅
- Use multi-stage builds
- Run as non-root user
- Use Alpine base images
- Implement health checks
- Use .dockerignore
- Version your images
- Scan for vulnerabilities
- Use secrets for sensitive data

### DON'T ❌
- Don't store secrets in images
- Don't run as root
- Don't use :latest in production
- Don't skip health checks
- Don't copy unnecessary files
- Don't expose all ports
- Don't ignore security updates

## Additional Resources

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
- [Prisma with Docker](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-docker)

## Support

For issues related to Docker setup:
1. Check logs: `docker-compose logs -f`
2. Verify environment variables
3. Ensure ports are not in use
4. Check Docker daemon is running
5. Review this guide

For application-specific issues, refer to main README.md
