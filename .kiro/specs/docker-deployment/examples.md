# Examples - ABYA Ecosystem Docker Configuration

## Dockerfile Examples

### Production Dockerfile (Multi-stage Build)

```dockerfile
# Dockerfile
# Stage 1: Dependencies
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install production dependencies
RUN npm ci --only=production

# Stage 2: Builder
FROM node:18-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files and install all dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
ENV NODE_ENV=production
RUN npm run build

# Stage 3: Runtime
FROM nginx:alpine AS runner
WORKDIR /usr/share/nginx/html

# Install runtime dependencies
RUN apk add --no-cache curl

# Copy custom nginx configuration
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder stage
COPY --from=builder /app/dist .

# Copy runtime configuration script
COPY docker/runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh
RUN chmod +x /docker-entrypoint.d/40-runtime-config.sh

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set proper permissions
RUN chown -R nodejs:nodejs /usr/share/nginx/html && \
    chown -R nodejs:nodejs /var/cache/nginx && \
    chown -R nodejs:nodejs /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nodejs:nodejs /var/run/nginx.pid

USER nodejs

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

### Development Dockerfile

```dockerfile
# Dockerfile.dev
FROM node:18-alpine

# Install development tools
RUN apk add --no-cache git python3 make g++

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies
RUN npm ci

# Copy application source
COPY . .

# Expose development server port
EXPOSE 3000

# Start development server with hot reload
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

## Docker Compose Examples

### Production Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  nginx-proxy:
    image: nginx:alpine
    container_name: abya-nginx-proxy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/proxy.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/certs:/etc/nginx/certs:ro
      - nginx-cache:/var/cache/nginx
    networks:
      - abya-network
    depends_on:
      - frontend
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  frontend:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        - BUILD_ENV=production
    container_name: abya-frontend
    environment:
      - NODE_ENV=production
      - VITE_APP_RPC_URL=${VITE_APP_RPC_URL}
      - VITE_APP_CHAIN_ID=${VITE_APP_CHAIN_ID}
      - VITE_APP_PINATA_API_KEY=${VITE_APP_PINATA_API_KEY}
      - VITE_APP_PINATA_SECRET_KEY=${VITE_APP_PINATA_SECRET_KEY}
      - VITE_APP_IPFS_GATEWAY=${VITE_APP_IPFS_GATEWAY}
    networks:
      - abya-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
        reservations:
          cpus: '0.25'
          memory: 128M

  redis:
    image: redis:alpine
    container_name: abya-redis
    networks:
      - abya-network
    volumes:
      - redis-data:/data
    restart: unless-stopped
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  abya-network:
    driver: bridge

volumes:
  nginx-cache:
  redis-data:
```

### Development Docker Compose

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  frontend-dev:
    build:
      context: .
      dockerfile: Dockerfile.dev
    container_name: abya-frontend-dev
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - VITE_APP_RPC_URL=https://testnet.skalenodes.com/v1/giant-half-dual-testnet
      - VITE_APP_CHAIN_ID=1020352220
      - VITE_APP_DEBUG_MODE=true
    networks:
      - abya-dev-network
    stdin_open: true
    tty: true

  redis-dev:
    image: redis:alpine
    container_name: abya-redis-dev
    ports:
      - "6379:6379"
    networks:
      - abya-dev-network
    volumes:
      - redis-dev-data:/data

networks:
  abya-dev-network:
    driver: bridge

volumes:
  redis-dev-data:
```

## Nginx Configuration Examples

### Main Nginx Configuration

```nginx
# nginx/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript 
               application/javascript application/xml+rss 
               application/json application/x-font-ttf
               font/opentype image/svg+xml image/x-icon;
    gzip_disable "MSIE [1-6]\.";

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=general:10m rate=50r/s;

    # Cache
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=static_cache:10m 
                     max_size=1g inactive=60m use_temp_path=off;

    # Include server configurations
    include /etc/nginx/conf.d/*.conf;
}
```

### Server Configuration

```nginx
# nginx/default.conf
upstream frontend_servers {
    least_conn;
    server frontend:80 weight=1 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    listen [::]:80;
    server_name abya.education www.abya.education;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name abya.education www.abya.education;

    # SSL Configuration
    ssl_certificate /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://testnet.skalenodes.com wss://testnet.skalenodes.com https://api.pinata.cloud;" always;

    # Root location
    location / {
        proxy_pass http://frontend_servers;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Cache static assets
        proxy_cache static_cache;
        proxy_cache_valid 200 1h;
        proxy_cache_valid 404 1m;
        proxy_cache_bypass $http_pragma;
        proxy_cache_revalidate on;
        proxy_cache_min_uses 3;
        proxy_cache_lock on;
    }

    # API endpoints
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://frontend_servers;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Don't cache API responses
        proxy_no_cache 1;
        proxy_cache_bypass 1;
    }

    # Static assets
    location /assets/ {
        proxy_pass http://frontend_servers;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://frontend_servers;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }

    # Error pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```

## Environment Configuration Examples

### Production Environment Variables

```bash
# .env.production
# Application Configuration
NODE_ENV=production
VITE_APP_ENV=production

# SKALE Network Configuration
VITE_APP_RPC_URL=https://mainnet.skalenodes.com/v1/elated-tan-skat
VITE_APP_CHAIN_ID=1564830818
VITE_APP_NETWORK_NAME=SKALE Mainnet

# Smart Contract Addresses
VITE_APP_LMS_TOKEN_ADDRESS=0x1234567890123456789012345678901234567890
VITE_APP_ECOSYSTEM_ADDRESS=0x2345678901234567890123456789012345678901
VITE_APP_TREASURY_ADDRESS=0x3456789012345678901234567890123456789012

# IPFS Configuration
VITE_APP_PINATA_API_KEY=your_pinata_api_key
VITE_APP_PINATA_SECRET_KEY=your_pinata_secret_key
VITE_APP_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/

# Security
VITE_APP_ALLOWED_ORIGINS=https://abya.education,https://www.abya.education

# Feature Flags
VITE_APP_ENABLE_ANALYTICS=true
VITE_APP_ENABLE_DEBUG=false
```

### Development Environment Variables

```bash
# .env.development
# Application Configuration
NODE_ENV=development
VITE_APP_ENV=development

# SKALE Testnet Configuration
VITE_APP_RPC_URL=https://testnet.skalenodes.com/v1/giant-half-dual-testnet
VITE_APP_CHAIN_ID=1020352220
VITE_APP_NETWORK_NAME=SKALE Testnet

# Test Contract Addresses
VITE_APP_LMS_TOKEN_ADDRESS=0xtest1234567890123456789012345678901234567890
VITE_APP_ECOSYSTEM_ADDRESS=0xtest2345678901234567890123456789012345678901
VITE_APP_TREASURY_ADDRESS=0xtest3456789012345678901234567890123456789012

# IPFS Configuration (Test)
VITE_APP_PINATA_API_KEY=test_pinata_api_key
VITE_APP_PINATA_SECRET_KEY=test_pinata_secret_key
VITE_APP_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/

# Security
VITE_APP_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Feature Flags
VITE_APP_ENABLE_ANALYTICS=false
VITE_APP_ENABLE_DEBUG=true
```

## Deployment Scripts

### Build and Deploy Script

```bash
#!/bin/bash
# deploy.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
DOCKER_REGISTRY="your-registry.com"
IMAGE_NAME="abya-ecosystem"
IMAGE_TAG=${2:-latest}

echo -e "${GREEN}Starting deployment for environment: ${ENVIRONMENT}${NC}"

# Load environment variables
if [ -f ".env.${ENVIRONMENT}" ]; then
    export $(cat .env.${ENVIRONMENT} | grep -v '^#' | xargs)
    echo -e "${GREEN}Environment variables loaded${NC}"
else
    echo -e "${RED}Environment file .env.${ENVIRONMENT} not found${NC}"
    exit 1
fi

# Build Docker image
echo -e "${YELLOW}Building Docker image...${NC}"
docker build \
    --build-arg BUILD_ENV=${ENVIRONMENT} \
    --tag ${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG} \
    --tag ${DOCKER_REGISTRY}/${IMAGE_NAME}:${ENVIRONMENT}-latest \
    .

# Run security scan
echo -e "${YELLOW}Running security scan...${NC}"
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
    aquasec/trivy image ${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}

# Push to registry
echo -e "${YELLOW}Pushing image to registry...${NC}"
docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}
docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:${ENVIRONMENT}-latest

# Deploy with docker-compose
echo -e "${YELLOW}Deploying application...${NC}"
docker-compose -f docker-compose.${ENVIRONMENT}.yml pull
docker-compose -f docker-compose.${ENVIRONMENT}.yml up -d

# Health check
echo -e "${YELLOW}Performing health check...${NC}"
sleep 10
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo -e "${GREEN}Deployment successful!${NC}"
else
    echo -e "${RED}Health check failed!${NC}"
    exit 1
fi

echo -e "${GREEN}Deployment complete!${NC}"
```

### Rollback Script

```bash
#!/bin/bash
# rollback.sh

set -e

# Configuration
ENVIRONMENT=${1:-production}
PREVIOUS_TAG=${2:-previous}
DOCKER_REGISTRY="your-registry.com"
IMAGE_NAME="abya-ecosystem"

echo "Starting rollback to ${PREVIOUS_TAG}..."

# Update docker-compose to use previous tag
sed -i "s|image: ${DOCKER_REGISTRY}/${IMAGE_NAME}:.*|image: ${DOCKER_REGISTRY}/${IMAGE_NAME}:${PREVIOUS_TAG}|g" \
    docker-compose.${ENVIRONMENT}.yml

# Perform rollback
docker-compose -f docker-compose.${ENVIRONMENT}.yml pull
docker-compose -f docker-compose.${ENVIRONMENT}.yml up -d

# Verify rollback
sleep 10
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "Rollback successful!"
else
    echo "Rollback failed!"
    exit 1
fi
```

## Makefile Example

```makefile
# Makefile

.PHONY: help build dev prod test clean

DOCKER_REGISTRY ?= your-registry.com
IMAGE_NAME ?= abya-ecosystem
IMAGE_TAG ?= $(shell git rev-parse --short HEAD)
ENVIRONMENT ?= production

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

build: ## Build Docker image
	docker build -t $(IMAGE_NAME):$(IMAGE_TAG) .

dev: ## Start development environment
	docker-compose -f docker-compose.dev.yml up

dev-down: ## Stop development environment
	docker-compose -f docker-compose.dev.yml down

prod: ## Start production environment
	docker-compose up -d

prod-down: ## Stop production environment
	docker-compose down

test: ## Run tests in Docker
	docker-compose -f docker-compose.test.yml up --abort-on-container-exit
	docker-compose -f docker-compose.test.yml down

logs: ## Show logs
	docker-compose logs -f

shell: ## Open shell in frontend container
	docker-compose exec frontend sh

clean: ## Clean up Docker resources
	docker-compose down -v
	docker system prune -f

scan: ## Security scan
	docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
		aquasec/trivy image $(IMAGE_NAME):$(IMAGE_TAG)

push: ## Push image to registry
	docker tag $(IMAGE_NAME):$(IMAGE_TAG) $(DOCKER_REGISTRY)/$(IMAGE_NAME):$(IMAGE_TAG)
	docker push $(DOCKER_REGISTRY)/$(IMAGE_NAME):$(IMAGE_TAG)

deploy: build push ## Build, push and deploy
	./scripts/deploy.sh $(ENVIRONMENT) $(IMAGE_TAG)

rollback: ## Rollback to previous version
	./scripts/rollback.sh $(ENVIRONMENT) $(PREVIOUS_TAG)
```

## GitHub Actions CI/CD Example

```yaml
# .github/workflows/deploy.yml
name: Build and Deploy

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy results to GitHub Security tab
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Deploy to production
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.PRODUCTION_HOST }}
          username: ${{ secrets.PRODUCTION_USER }}
          key: ${{ secrets.PRODUCTION_SSH_KEY }}
          script: |
            cd /opt/abya-ecosystem
            docker-compose pull
            docker-compose up -d
            docker system prune -f
```

## Runtime Configuration Script

```bash
#!/bin/sh
# docker/runtime-config.sh

# This script injects runtime configuration into the built React app

cat > /usr/share/nginx/html/config.js <<EOF
window.__RUNTIME_CONFIG__ = {
  RPC_URL: "${VITE_APP_RPC_URL}",
  CHAIN_ID: "${VITE_APP_CHAIN_ID}",
  IPFS_GATEWAY: "${VITE_APP_IPFS_GATEWAY}",
  ENVIRONMENT: "${NODE_ENV}"
};
EOF

echo "Runtime configuration injected successfully"
```

## Docker Ignore File

```gitignore
# .dockerignore
node_modules
npm-debug.log
.git
.gitignore
.env*
.vscode
.idea
*.md
.DS_Store
coverage
.nyc_output
test
tests
*.test.js
*.spec.js
docker-compose*.yml
Dockerfile*
.dockerignore
.github
.gitlab-ci.yml
.travis.yml
```

## Monitoring Configuration

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: abya-prometheus
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    ports:
      - "9090:9090"
    networks:
      - abya-network
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: abya-grafana
    volumes:
      - grafana-data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    networks:
      - abya-network
    restart: unless-stopped

  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    container_name: abya-cadvisor
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
    ports:
      - "8080:8080"
    networks:
      - abya-network
    restart: unless-stopped

volumes:
  prometheus-data:
  grafana-data:

networks:
  abya-network:
    external: true
```

These examples provide a comprehensive starting point for containerizing the ABYA Ecosystem application with Docker, Docker Compose, and Nginx.
