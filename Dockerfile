FROM python:3.11-alpine3.19 AS base

# Install system dependencies
RUN apk add --no-cache \
    nginx \
    bash \
    curl \
    nodejs \
    npm \
    build-base \
    linux-headers \
    libffi-dev

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Set working directory
WORKDIR /app

# Stage 2: Build UI
FROM base AS ui-builder

# Force rebuild - v0.1.6
RUN echo "Building UI for v0.1.6"

# Copy UI source
COPY ui/ /app/ui/

# Build frontend
RUN cd /app/ui && \
    npm ci && \
    npm run build && \
    mkdir -p /app/ui/dist && \
    cp -r dist/* /app/ui/dist/ || echo "No dist yet"

# Stage 3: Final image
FROM base AS final

# Copy Python requirements
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Force rebuild on version change - v0.1.6
RUN echo "Building version 0.1.6"

# Copy application code
COPY app/ /app/app/
COPY run.sh /app/
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built UI from ui-builder stage
COPY --from=ui-builder /app/ui/dist /app/ui/dist

# Create necessary directories
RUN mkdir -p /app/ui/dist && \
    mkdir -p /run/nginx && \
    mkdir -p /var/log/nginx && \
    chown -R appuser:appgroup /app && \
    chown -R appuser:appgroup /run/nginx && \
    chown -R appuser:appgroup /var/log/nginx && \
    chmod +x /app/run.sh

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Expose port
EXPOSE 5000

# Switch to non-root user
USER appuser

# Entry point
CMD ["/app/run.sh"]
