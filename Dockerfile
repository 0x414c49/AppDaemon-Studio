# Multi-stage Dockerfile for Next.js standalone output
# Smaller, faster builds with only production dependencies

# Stage 1: Build the application
FROM node:20-alpine AS builder

# Build argument to bust cache when needed
ARG BUILD_VERSION=unknown
ARG BUILD_DATE=unknown

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the Next.js app (creates standalone output)
RUN npm run build

# Stage 2: Production image (smaller, no build tools)
FROM node:20-alpine AS runner

WORKDIR /app

# Install libc6-compat for Alpine compatibility
RUN apk add --no-cache libc6-compat

# Copy only the standalone output and necessary files
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://localhost:3000/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Environment
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production

# Pass through Supervisor token if available
ENV SUPERVISOR_TOKEN=${SUPERVISOR_TOKEN}

# Start the standalone server
CMD node server.js
