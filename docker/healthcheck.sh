#!/bin/sh
# ABYA Ecosystem Health Check Script
# Comprehensive health checking for containerized application
# Compatible with both Unix shells and PowerShell environments

set -e

# Configuration
HEALTH_ENDPOINT="${HEALTH_ENDPOINT:-http://localhost/health}"
TIMEOUT="${HEALTH_TIMEOUT:-10}"
MAX_RETRIES="${HEALTH_MAX_RETRIES:-3}"
RETRY_DELAY="${HEALTH_RETRY_DELAY:-2}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') [HEALTH] $1"
}

# Health check function
check_health() {
    local attempt=1
    
    while [ $attempt -le $MAX_RETRIES ]; do
        log "Health check attempt $attempt/$MAX_RETRIES"
        
        # Check if the health endpoint responds
        if curl -f -s --max-time $TIMEOUT "$HEALTH_ENDPOINT" > /dev/null 2>&1; then
            log "${GREEN}✅ Health check passed${NC}"
            return 0
        fi
        
        log "${YELLOW}⚠️  Health check failed (attempt $attempt/$MAX_RETRIES)${NC}"
        
        if [ $attempt -lt $MAX_RETRIES ]; then
            log "Retrying in ${RETRY_DELAY}s..."
            sleep $RETRY_DELAY
        fi
        
        attempt=$((attempt + 1))
    done
    
    log "${RED}❌ Health check failed after $MAX_RETRIES attempts${NC}"
    return 1
}

# Detailed health check with JSON response
check_detailed_health() {
    local response
    local status_code
    
    log "Performing detailed health check..."
    
    # Get the health response
    response=$(curl -s --max-time $TIMEOUT -w "HTTPSTATUS:%{http_code}" "$HEALTH_ENDPOINT" 2>/dev/null || echo "HTTPSTATUS:000")
    
    # Extract status code
    status_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    
    # Extract body
    body=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')
    
    log "HTTP Status: $status_code"
    
    if [ "$status_code" = "200" ]; then
        log "${GREEN}✅ Service is healthy${NC}"
        
        # Try to parse JSON response
        if command -v jq >/dev/null 2>&1 && echo "$body" | jq . >/dev/null 2>&1; then
            log "Health details:"
            echo "$body" | jq .
        else
            log "Health response: $body"
        fi
        
        return 0
    else
        log "${RED}❌ Service is unhealthy (HTTP $status_code)${NC}"
        log "Response: $body"
        return 1
    fi
}

# Check if required tools are available
check_dependencies() {
    if ! command -v curl >/dev/null 2>&1; then
        log "${RED}❌ curl is not available${NC}"
        return 1
    fi
    
    return 0
}

# Main execution
main() {
    log "Starting ABYA Ecosystem health check..."
    log "Endpoint: $HEALTH_ENDPOINT"
    log "Timeout: ${TIMEOUT}s"
    log "Max retries: $MAX_RETRIES"
    
    # Check dependencies
    if ! check_dependencies; then
        exit 1
    fi
    
    # Perform health check
    if [ "${DETAILED_CHECK:-false}" = "true" ]; then
        check_detailed_health
    else
        check_health
    fi
    
    exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        log "${GREEN}🎉 Health check completed successfully${NC}"
    else
        log "${RED}💥 Health check failed${NC}"
    fi
    
    exit $exit_code
}

# Handle script arguments
case "${1:-}" in
    "detailed")
        DETAILED_CHECK=true
        main
        ;;
    "quick")
        MAX_RETRIES=1
        main
        ;;
    *)
        main
        ;;
esac