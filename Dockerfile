# ═══════════════════════════════════════════════════════════
# Multi-Stage Production Docker Build for Node.js Backend
# ═══════════════════════════════════════════════════════════
#
# Benefits of multi-stage build:
# - Smaller final image (only production dependencies)
# - Faster builds (cached layers)
# - More secure (no build tools in production)
# - Optimized for production deployment
#
# Build: docker build -t quantum-billing-backend .
# Run: docker run -p 3000:3000 quantum-billing-backend
#
# ═══════════════════════════════════════════════════════════

# ═══════════════════════════════════════════════════════════
# Stage 1: Dependencies
# ═══════════════════════════════════════════════════════════
FROM node:20-alpine AS dependencies

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies for build)
RUN npm ci

# ═══════════════════════════════════════════════════════════
# Stage 2: Build
# ═══════════════════════════════════════════════════════════
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy source code and config files
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript code
RUN npm run build

# ═══════════════════════════════════════════════════════════
# Stage 3: Production Dependencies
# ═══════════════════════════════════════════════════════════
FROM node:20-alpine AS production-deps

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# ═══════════════════════════════════════════════════════════
# Stage 4: Production Runtime
# ═══════════════════════════════════════════════════════════
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy production dependencies
COPY --from=production-deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=build --chown=nodejs:nodejs /app/dist ./dist

# Copy Prisma schema (needed for migrations)
COPY --from=build --chown=nodejs:nodejs /app/prisma ./prisma

# Copy package.json for metadata
COPY --chown=nodejs:nodejs package*.json ./

# Create logs directory with proper permissions
RUN mkdir -p /app/logs && chown -R nodejs:nodejs /app/logs

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Environment variables (override these at runtime)
ENV NODE_ENV=production \
    PORT=3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/server.js"]
