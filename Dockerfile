# Multi-stage Dockerfile for ABYA Ecosystem
# Stage 1: Dependencies (Optimized caching layer)
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Copy package files for dependency caching
COPY package.json package-lock.json ./

# Install dependencies with optimizations and BuildKit cache mounts
RUN --mount=type=cache,target=/root/.npm \
    npm ci --only=production --prefer-offline --no-audit \
    && npm cache clean --force

# Stage 2: Builder (Optimized build layer)
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Copy package files and install all dependencies with BuildKit cache mounts
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit

# Copy source code (excluding unnecessary files via .dockerignore)
COPY . .

# Build the application with optimizations and parallel processing
ENV NODE_ENV=production
ENV VITE_BUILD_TARGET=production
ARG BUILD_ARGS=""
RUN --mount=type=cache,target=/app/node_modules/.cache \
    npm run build ${BUILD_ARGS} \
    && npm prune --production \
    && npm cache clean --force \
    && rm -rf /tmp/* /var/tmp/* /root/.cache

# Stage 3: Runtime (Optimized nginx layer)
FROM nginx:1.25-alpine AS runner
WORKDIR /usr/share/nginx/html

# Install minimal runtime dependencies
RUN apk add --no-cache curl dumb-init \
    && rm -rf /var/cache/apk/*

# Copy custom nginx configuration
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder stage (Vite outputs to 'dist' by default)
COPY --from=builder /app/dist .

# Copy runtime configuration script
COPY docker/runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh
RUN chmod +x /docker-entrypoint.d/40-runtime-config.sh

# Create non-root user for security
RUN addgroup -g 1001 -S nginx-user && \
    adduser -S nginx-user -u 1001 -G nginx-user

# Create necessary directories and set permissions
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/run \
    && chown -R nginx-user:nginx-user /usr/share/nginx/html \
    && chown -R nginx-user:nginx-user /var/cache/nginx \
    && chown -R nginx-user:nginx-user /var/log/nginx \
    && chown -R nginx-user:nginx-user /var/run \
    && touch /var/run/nginx.pid \
    && chown nginx-user:nginx-user /var/run/nginx.pid

# Switch to non-root user
USER nginx-user

# Expose port
EXPOSE 80

# Add labels for better container management
LABEL maintainer="ABYA Ecosystem Team" \
      version="1.0" \
      description="ABYA Ecosystem Web3 LMS Frontend" \
      org.opencontainers.image.source="https://github.com/abya-university/ABYA-Ecosystem"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["nginx", "-g", "daemon off;"]
