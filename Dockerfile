# Dockerfile for Next.js server mode
# Server mode allows runtime env var access (unlike standalone)

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

# Build the Next.js app (server mode - NOT standalone)
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine AS runner

WORKDIR /app

# Install libc6-compat for Alpine compatibility
RUN apk add --no-cache libc6-compat

# Copy built application and dependencies
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/node_modules ./node_modules

# Copy startup script
COPY scripts/start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://localhost:3000/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Environment
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production

# Start using wrapper script
CMD ["/app/start.sh"]
