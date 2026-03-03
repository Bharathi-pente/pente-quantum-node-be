# ═══════════════════════════════════════════════════════════
# Production Docker Build for Node.js Backend
# ═══════════════════════════════════════════════════════════
#
# Build: docker build -t quantum-billing-backend .
# Run: docker run -p 3000:3000 --env-file .env quantum-billing-backend
#
# ═══════════════════════════════════════════════════════════

FROM node:20-alpine

# Install dumb-init and OpenSSL for Prisma
RUN apk add --no-cache dumb-init openssl libc6-compat

# Create app directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy Prisma schema
COPY prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Install dev dependencies temporarily for build
RUN npm ci

# Copy TypeScript source and config
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm run build

# Remove dev dependencies
RUN npm prune --omit=dev

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    mkdir -p /app/logs && \
    chown nodejs:nodejs /app/logs

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Environment variables (can be overridden at runtime)
ENV NODE_ENV=production \
    PORT=3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/server.js"]
