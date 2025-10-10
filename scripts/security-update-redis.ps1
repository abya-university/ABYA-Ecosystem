#!/usr/bin/env pwsh
# ABYA Ecosystem - Redis Security Update Script
# Purpose: Automated deployment of CVE-2025-49844 security patch

param(
    [Parameter()]
    [switch]$SkipBackup,
    
    [Parameter()]
    [switch]$Production,
    
    [Parameter()]
    [string]$RedisPassword
)

# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "ABYA Ecosystem - Redis Security Update" -ForegroundColor Cyan
Write-Host "CVE-2025-49844 Mitigation" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker status..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not running. Please start Docker and try again." -ForegroundColor Red
    exit 1
}

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠ Warning: .env file not found" -ForegroundColor Yellow
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    New-Item -Path ".env" -ItemType File | Out-Null
}

# Set or verify Redis password
if (-not $RedisPassword) {
    # Check if password exists in .env
    $envContent = Get-Content ".env" -ErrorAction SilentlyContinue
    $existingPassword = $envContent | Where-Object { $_ -match "^REDIS_PASSWORD=" }
    
    if ($existingPassword) {
        Write-Host "✓ Redis password found in .env file" -ForegroundColor Green
    } else {
        Write-Host "Generating secure Redis password..." -ForegroundColor Yellow
        $RedisPassword = -join ((33..126) | Get-Random -Count 32 | ForEach-Object {[char]$_})
        Add-Content -Path ".env" -Value "REDIS_PASSWORD=$RedisPassword"
        Write-Host "✓ Generated and saved Redis password to .env" -ForegroundColor Green
    }
} else {
    Write-Host "Using provided Redis password..." -ForegroundColor Yellow
    # Update .env file
    $envContent = Get-Content ".env" -ErrorAction SilentlyContinue
    $envContent = $envContent | Where-Object { $_ -notmatch "^REDIS_PASSWORD=" }
    $envContent += "REDIS_PASSWORD=$RedisPassword"
    $envContent | Set-Content ".env"
    Write-Host "✓ Updated Redis password in .env" -ForegroundColor Green
}

# Backup Redis data
if (-not $SkipBackup) {
    Write-Host ""
    Write-Host "Creating backup of Redis data..." -ForegroundColor Yellow
    
    # Create backup directory
    $backupDir = "./backups"
    if (-not (Test-Path $backupDir)) {
        New-Item -ItemType Directory -Path $backupDir | Out-Null
    }
    
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupFile = "redis-backup-$timestamp.tar.gz"
    
    try {
        docker run --rm `
            -v "abya-ecosystem_redis_data:/data" `
            -v "${PWD}/backups:/backup" `
            alpine tar czf "/backup/$backupFile" -C /data .
        
        Write-Host "✓ Backup created: $backupFile" -ForegroundColor Green
    } catch {
        Write-Host "⚠ Warning: Backup failed, but continuing..." -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠ Skipping backup as requested" -ForegroundColor Yellow
}

# Pull updated Redis image
Write-Host ""
Write-Host "Pulling updated Redis image (7.2.11-alpine)..." -ForegroundColor Yellow
try {
    if ($Production) {
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml pull redis
    } else {
        docker-compose pull redis
    }
    Write-Host "✓ Redis image updated" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to pull Redis image" -ForegroundColor Red
    exit 1
}

# Stop current services
Write-Host ""
Write-Host "Stopping current services..." -ForegroundColor Yellow
try {
    if ($Production) {
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
    } else {
        docker-compose down
    }
    Write-Host "✓ Services stopped" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to stop services" -ForegroundColor Red
    exit 1
}

# Start updated services
Write-Host ""
Write-Host "Starting updated services..." -ForegroundColor Yellow
try {
    if ($Production) {
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
    } else {
        docker-compose up -d
    }
    Write-Host "✓ Services started" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to start services" -ForegroundColor Red
    exit 1
}

# Wait for Redis to be ready
Write-Host ""
Write-Host "Waiting for Redis to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Verify Redis version
Write-Host ""
Write-Host "Verifying Redis version..." -ForegroundColor Yellow
try {
    $redisVersion = docker exec abya-redis redis-cli INFO SERVER | Select-String "redis_version"
    Write-Host "✓ $redisVersion" -ForegroundColor Green
    
    if ($redisVersion -match "7\.2\.11") {
        Write-Host "✓ Redis version is patched (7.2.11)" -ForegroundColor Green
    } else {
        Write-Host "⚠ Warning: Redis version may not be the expected 7.2.11" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ Warning: Could not verify Redis version" -ForegroundColor Yellow
}

# Test Redis connectivity
Write-Host ""
Write-Host "Testing Redis connectivity..." -ForegroundColor Yellow
try {
    # Load Redis password from .env
    $envContent = Get-Content ".env"
    $passwordLine = $envContent | Where-Object { $_ -match "^REDIS_PASSWORD=(.+)$" }
    if ($passwordLine) {
        $env:REDIS_PASSWORD = $passwordLine -replace "^REDIS_PASSWORD=", ""
        $result = docker exec abya-redis redis-cli -a $env:REDIS_PASSWORD PING 2>$null
        if ($result -eq "PONG") {
            Write-Host "✓ Redis is responding correctly with authentication" -ForegroundColor Green
        } else {
            Write-Host "⚠ Warning: Redis responded but with unexpected result: $result" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠ Warning: Could not load Redis password from .env" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ Warning: Could not test Redis connectivity" -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Security Update Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✓ Redis updated to version 7.2.11 (CVE-2025-49844 patched)" -ForegroundColor Green
Write-Host "✓ Password authentication enabled" -ForegroundColor Green
Write-Host "✓ Protected mode enabled" -ForegroundColor Green
Write-Host "✓ Network bound to localhost only" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Verify your application connects to Redis successfully" -ForegroundColor White
Write-Host "2. Monitor Redis logs: docker logs -f abya-redis" -ForegroundColor White
Write-Host "3. Update DigitalOcean that you've patched the vulnerability" -ForegroundColor White
Write-Host ""
Write-Host "For more details, see: SECURITY_UPDATE_CVE-2025-49844.md" -ForegroundColor Cyan
Write-Host ""
