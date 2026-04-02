# ═══════════════════════════════════════════════════════════
# Production Docker Build for Node.js Backend
# ═══════════════════════════════════════════════════════════
#
# Build: docker build -t quantum-billing-backend .
# Run: docker run -p 5000:5000 --env-file .env quantum-billing-backend
#
# ═══════════════════════════════════════════════════════════

# ═══════════════════════════════════════════════════════════
# Stage 1: Builder
# ═══════════════════════════════════════════════════════════
FROM node:20-alpine AS builder

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl libc6-compat

# Create app directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including dev dependencies for building)
RUN npm ci

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy TypeScript source and config
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm run build

# ═══════════════════════════════════════════════════════════
# Stage 2: Production
# ═══════════════════════════════════════════════════════════
FROM node:20-alpine

# Install dumb-init and OpenSSL for Prisma
RUN apk add --no-cache dumb-init openssl libc6-compat

# Create app directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    mkdir -p /app/logs && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Environment variables (can be overridden at runtime)
ENV NODE_ENV=production \
    PORT=5000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/server.js"]
