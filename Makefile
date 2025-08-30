# ABYA Ecosystem Docker Development Commands

.PHONY: help dev-up dev-down dev-logs dev-build dev-clean dev-restart test

# Default target
help:
	@echo "ABYA Ecosystem Docker Development Commands"
	@echo "=========================================="
	@echo "dev-up       - Start development environment"
	@echo "dev-down     - Stop development environment"
	@echo "dev-logs     - View development logs"
	@echo "dev-build    - Build development containers"
	@echo "dev-clean    - Clean development environment"
	@echo "dev-restart  - Restart development environment"
	@echo "test         - Run tests in container"
	@echo "shell        - Open shell in frontend container"

# Start development environment
dev-up:
	@echo "Starting ABYA Ecosystem development environment..."
	docker-compose -f docker-compose.dev.yml up -d
	@echo "Development environment started!"
	@echo "Frontend available at: http://localhost:3000"
	@echo "Redis available at: localhost:6379"

# Stop development environment
dev-down:
	@echo "Stopping ABYA Ecosystem development environment..."
	docker-compose -f docker-compose.dev.yml down

# View development logs
dev-logs:
	docker-compose -f docker-compose.dev.yml logs -f

# Build development containers
dev-build:
	@echo "Building development containers..."
	docker-compose -f docker-compose.dev.yml build --no-cache

# Clean development environment (removes volumes)
dev-clean:
	@echo "Cleaning development environment..."
	docker-compose -f docker-compose.dev.yml down -v
	docker system prune -f

# Restart development environment
dev-restart:
	@echo "Restarting development environment..."
	docker-compose -f docker-compose.dev.yml restart

# Run tests in container
test:
	docker-compose -f docker-compose.dev.yml exec frontend-dev npm test

# Open shell in frontend container
shell:
	docker-compose -f docker-compose.dev.yml exec frontend-dev sh

# Install new dependencies
install:
	docker-compose -f docker-compose.dev.yml exec frontend-dev npm install
	docker-compose -f docker-compose.dev.yml restart frontend-dev