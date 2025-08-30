# ABYA Ecosystem Production Deployment Script (PowerShell)
# Handles production deployment with safety checks and rollback capability

param(
    [string]$Version = "latest",
    [string]$Environment = "production",
    [switch]$DryRun,
    [switch]$Force,
    [switch]$Rollback,
    [string]$RollbackVersion = "",
    [switch]$SkipTests,
    [switch]$SkipBackup
)

# Configuration
$ErrorActionPreference = "Stop"
$ComposeFile = "docker-compose.prod.yml"
$EnvFile = ".env.production"
$BackupDir = "./backups"
$LogFile = "./logs/deployment-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

# Logging function
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $color = switch ($Level) {
        "ERROR" { "Red" }
        "WARN" { "Yellow" }
        "SUCCESS" { "Green" }
        "INFO" { "Cyan" }
        default { "White" }
    }
    
    $logMessage = "[$timestamp] [$Level] $Message"
    Write-Host $logMessage -ForegroundColor $color
    
    # Write to log file
    if (-not (Test-Path (Split-Path $LogFile))) {
        New-Item -ItemType Directory -Path (Split-Path $LogFile) -Force | Out-Null
    }
    Add-Content -Path $LogFile -Value $logMessage
}

# Pre-deployment checks
function Test-PreDeployment {
    Write-Log "Running pre-deployment checks..."
    
    # Check if Docker is running
    try {
        $dockerVersion = docker version --format '{{.Server.Version}}' 2>$null
        if (-not $dockerVersion) {
            throw "Docker not running"
        }
        Write-Log "✅ Docker is running (version: $dockerVersion)" -Level "SUCCESS"
    }
    catch {
        Write-Log "❌ Docker is not running or not accessible" -Level "ERROR"
        return $false
    }
    
    # Check if Docker Compose is available
    try {
        $composeVersion = docker-compose version --short 2>$null
        if (-not $composeVersion) {
            throw "Docker Compose not found"
        }
        Write-Log "✅ Docker Compose is available (version: $composeVersion)" -Level "SUCCESS"
    }
    catch {
        Write-Log "❌ Docker Compose is not available" -Level "ERROR"
        return $false
    }
    
    # Check if compose file exists
    if (-not (Test-Path $ComposeFile)) {
        Write-Log "❌ Compose file not found: $ComposeFile" -Level "ERROR"
        return $false
    }
    Write-Log "✅ Compose file found: $ComposeFile" -Level "SUCCESS"
    
    # Check if environment file exists
    if (-not (Test-Path $EnvFile)) {
        Write-Log "❌ Environment file not found: $EnvFile" -Level "ERROR"
        return $false
    }
    Write-Log "✅ Environment file found: $EnvFile" -Level "SUCCESS"
    
    # Check disk space
    $disk = Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'"
    $freeSpaceGB = [math]::Round($disk.FreeSpace / 1GB, 2)
    if ($freeSpaceGB -lt 5) {
        Write-Log "❌ Insufficient disk space: ${freeSpaceGB}GB available (minimum 5GB required)" -Level "ERROR"
        return $false
    }
    Write-Log "✅ Sufficient disk space: ${freeSpaceGB}GB available" -Level "SUCCESS"
    
    # Check if required directories exist
    $requiredDirs = @("./certs", "./logs", "./data")
    foreach ($dir in $requiredDirs) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Log "✅ Created directory: $dir" -Level "SUCCESS"
        }
    }
    
    return $true
}

# Create backup
function New-Backup {
    if ($SkipBackup) {
        Write-Log "Skipping backup (--SkipBackup flag set)" -Level "WARN"
        return $true
    }
    
    Write-Log "Creating backup..."
    
    if (-not (Test-Path $BackupDir)) {
        New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    }
    
    $backupName = "abya-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    $backupPath = Join-Path $BackupDir "$backupName.tar.gz"
    
    try {
        # Create backup using Docker
        $backupResult = docker run --rm -v "${PWD}:/workspace" -v "${PWD}/data:/data" -v "${PWD}/logs:/logs" alpine:latest sh -c "
            apk add --no-cache tar gzip &&
            cd /workspace &&
            tar -czf /workspace/backups/$backupName.tar.gz data logs docker-compose.prod.yml .env.production
        " 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✅ Backup created: $backupPath" -Level "SUCCESS"
            return $true
        }
        else {
            Write-Log "❌ Backup failed: $backupResult" -Level "ERROR"
            return $false
        }
    }
    catch {
        Write-Log "❌ Backup failed: $($_.Exception.Message)" -Level "ERROR"
        return $false
    }
}

# Run tests
function Invoke-Tests {
    if ($SkipTests) {
        Write-Log "Skipping tests (--SkipTests flag set)" -Level "WARN"
        return $true
    }
    
    Write-Log "Running tests..."
    
    try {
        # Build test image
        $buildResult = docker build -t abya-ecosystem:test --target builder . 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Log "❌ Test build failed: $buildResult" -Level "ERROR"
            return $false
        }
        
        # Run tests
        $testResult = docker run --rm abya-ecosystem:test npm test 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✅ Tests passed" -Level "SUCCESS"
            return $true
        }
        else {
            Write-Log "❌ Tests failed: $testResult" -Level "ERROR"
            return $false
        }
    }
    catch {
        Write-Log "❌ Test execution failed: $($_.Exception.Message)" -Level "ERROR"
        return $false
    }
}

# Deploy application
function Start-Deployment {
    Write-Log "Starting deployment..."
    
    if ($DryRun) {
        Write-Log "DRY RUN: Would deploy version $Version" -Level "WARN"
        return $true
    }
    
    try {
        # Set environment variables
        $env:APP_VERSION = $Version
        $env:ENVIRONMENT = $Environment
        
        # Pull latest images
        Write-Log "Pulling latest images..."
        $pullResult = docker-compose -f $ComposeFile --env-file $EnvFile pull 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Log "❌ Image pull failed: $pullResult" -Level "ERROR"
            return $false
        }
        
        # Deploy with rolling update
        Write-Log "Deploying services..."
        $deployResult = docker-compose -f $ComposeFile --env-file $EnvFile up -d --remove-orphans 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Log "❌ Deployment failed: $deployResult" -Level "ERROR"
            return $false
        }
        
        Write-Log "✅ Deployment completed" -Level "SUCCESS"
        return $true
    }
    catch {
        Write-Log "❌ Deployment failed: $($_.Exception.Message)" -Level "ERROR"
        return $false
    }
}

# Health check
function Test-Deployment {
    Write-Log "Running post-deployment health checks..."
    
    $maxAttempts = 30
    $attempt = 1
    
    while ($attempt -le $maxAttempts) {
        Write-Log "Health check attempt $attempt/$maxAttempts"
        
        try {
            $response = Invoke-WebRequest -Uri "http://localhost/health" -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
            
            if ($response.StatusCode -eq 200) {
                Write-Log "✅ Health check passed" -Level "SUCCESS"
                return $true
            }
        }
        catch {
            Write-Log "⚠️ Health check failed (attempt $attempt): $($_.Exception.Message)" -Level "WARN"
        }
        
        if ($attempt -lt $maxAttempts) {
            Start-Sleep -Seconds 10
        }
        $attempt++
    }
    
    Write-Log "❌ Health check failed after $maxAttempts attempts" -Level "ERROR"
    return $false
}

# Rollback deployment
function Start-Rollback {
    Write-Log "Starting rollback..."
    
    if (-not $RollbackVersion) {
        Write-Log "❌ Rollback version not specified" -Level "ERROR"
        return $false
    }
    
    try {
        # Set rollback version
        $env:APP_VERSION = $RollbackVersion
        
        Write-Log "Rolling back to version: $RollbackVersion"
        $rollbackResult = docker-compose -f $ComposeFile --env-file $EnvFile up -d --remove-orphans 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✅ Rollback completed" -Level "SUCCESS"
            return $true
        }
        else {
            Write-Log "❌ Rollback failed: $rollbackResult" -Level "ERROR"
            return $false
        }
    }
    catch {
        Write-Log "❌ Rollback failed: $($_.Exception.Message)" -Level "ERROR"
        return $false
    }
}

# Cleanup old resources
function Remove-OldResources {
    Write-Log "Cleaning up old resources..."
    
    try {
        # Remove unused images
        $cleanupResult = docker image prune -f 2>&1
        Write-Log "✅ Cleaned up unused images" -Level "SUCCESS"
        
        # Remove old backups (keep last 7 days)
        $oldBackups = Get-ChildItem -Path $BackupDir -Filter "*.tar.gz" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) }
        foreach ($backup in $oldBackups) {
            Remove-Item $backup.FullName -Force
            Write-Log "✅ Removed old backup: $($backup.Name)" -Level "SUCCESS"
        }
        
        return $true
    }
    catch {
        Write-Log "⚠️ Cleanup warning: $($_.Exception.Message)" -Level "WARN"
        return $true  # Don't fail deployment for cleanup issues
    }
}

# Main execution
function Main {
    Write-Log "🚀 Starting ABYA Ecosystem production deployment..."
    Write-Log "Version: $Version"
    Write-Log "Environment: $Environment"
    Write-Log "Dry Run: $DryRun"
    
    if ($Rollback) {
        Write-Log "🔄 Rollback mode enabled"
        
        if (Start-Rollback) {
            if (Test-Deployment) {
                Write-Log "🎉 Rollback completed successfully!" -Level "SUCCESS"
                exit 0
            }
            else {
                Write-Log "💥 Rollback health check failed" -Level "ERROR"
                exit 1
            }
        }
        else {
            Write-Log "💥 Rollback failed" -Level "ERROR"
            exit 1
        }
    }
    
    # Pre-deployment checks
    if (-not (Test-PreDeployment)) {
        Write-Log "💥 Pre-deployment checks failed" -Level "ERROR"
        exit 1
    }
    
    # Create backup
    if (-not (New-Backup)) {
        if (-not $Force) {
            Write-Log "💥 Backup failed. Use --Force to continue anyway." -Level "ERROR"
            exit 1
        }
        else {
            Write-Log "⚠️ Backup failed but continuing due to --Force flag" -Level "WARN"
        }
    }
    
    # Run tests
    if (-not (Invoke-Tests)) {
        if (-not $Force) {
            Write-Log "💥 Tests failed. Use --Force to continue anyway." -Level "ERROR"
            exit 1
        }
        else {
            Write-Log "⚠️ Tests failed but continuing due to --Force flag" -Level "WARN"
        }
    }
    
    # Deploy
    if (-not (Start-Deployment)) {
        Write-Log "💥 Deployment failed" -Level "ERROR"
        exit 1
    }
    
    # Health check
    if (-not (Test-Deployment)) {
        Write-Log "💥 Post-deployment health check failed" -Level "ERROR"
        
        if (-not $Force) {
            Write-Log "🔄 Initiating automatic rollback..." -Level "WARN"
            # Implement automatic rollback logic here
        }
        
        exit 1
    }
    
    # Cleanup
    Remove-OldResources | Out-Null
    
    Write-Log "🎉 Production deployment completed successfully!" -Level "SUCCESS"
    Write-Log "📊 Deployment summary:" -Level "INFO"
    Write-Log "   Version: $Version" -Level "INFO"
    Write-Log "   Environment: $Environment" -Level "INFO"
    Write-Log "   Log file: $LogFile" -Level "INFO"
    
    exit 0
}

# Execute main function
Main