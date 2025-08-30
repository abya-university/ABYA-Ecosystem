# ABYA Ecosystem Health Check Script (PowerShell)
# Comprehensive health checking for containerized application

param(
    [string]$Endpoint = "http://localhost/health",
    [int]$Timeout = 10,
    [int]$MaxRetries = 3,
    [int]$RetryDelay = 2,
    [switch]$Detailed
)

# Configuration
$HealthEndpoint = $Endpoint
$HealthTimeout = $Timeout
$MaxRetries = $MaxRetries
$RetryDelay = $RetryDelay

# Logging function
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $color = switch ($Level) {
        "ERROR" { "Red" }
        "WARN" { "Yellow" }
        "SUCCESS" { "Green" }
        default { "White" }
    }
    
    Write-Host "[$timestamp] [HEALTH] $Message" -ForegroundColor $color
}

# Health check function
function Test-Health {
    $attempt = 1
    
    while ($attempt -le $MaxRetries) {
        Write-Log "Health check attempt $attempt/$MaxRetries"
        
        try {
            # Check if the health endpoint responds
            $response = Invoke-WebRequest -Uri $HealthEndpoint -TimeoutSec $HealthTimeout -UseBasicParsing
            
            if ($response.StatusCode -eq 200) {
                Write-Log "✅ Health check passed" "SUCCESS"
                return $true
            }
        }
        catch {
            Write-Log "⚠️  Health check failed (attempt $attempt/$MaxRetries): $($_.Exception.Message)" "WARN"
        }
        
        if ($attempt -lt $MaxRetries) {
            Write-Log "Retrying in ${RetryDelay}s..."
            Start-Sleep -Seconds $RetryDelay
        }
        
        $attempt++
    }
    
    Write-Log "❌ Health check failed after $MaxRetries attempts" "ERROR"
    return $false
}

# Detailed health check with JSON response
function Test-DetailedHealth {
    Write-Log "Performing detailed health check..."
    
    try {
        $response = Invoke-WebRequest -Uri $HealthEndpoint -TimeoutSec $HealthTimeout -UseBasicParsing
        
        Write-Log "HTTP Status: $($response.StatusCode)"
        
        if ($response.StatusCode -eq 200) {
            Write-Log "✅ Service is healthy" "SUCCESS"
            
            # Try to parse JSON response
            try {
                $healthData = $response.Content | ConvertFrom-Json
                Write-Log "Health details:"
                $healthData | ConvertTo-Json -Depth 3 | Write-Host
            }
            catch {
                Write-Log "Health response: $($response.Content)"
            }
            
            return $true
        }
        else {
            Write-Log "❌ Service is unhealthy (HTTP $($response.StatusCode))" "ERROR"
            Write-Log "Response: $($response.Content)"
            return $false
        }
    }
    catch {
        Write-Log "❌ Failed to connect to health endpoint: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Check Docker containers status
function Test-ContainerHealth {
    Write-Log "Checking Docker containers status..."
    
    try {
        # Check if Docker is running
        docker version | Out-Null
        
        # Get container status
        $containers = docker-compose -f "docker-compose.dev.yml" ps --format "table {{.Name}}\t{{.State}}\t{{.Status}}"
        
        if ($containers) {
            Write-Log "Container Status:"
            $containers | Write-Host
            
            # Check if any containers are unhealthy
            $unhealthyContainers = docker ps --filter "health=unhealthy" --format "{{.Names}}"
            
            if ($unhealthyContainers) {
                Write-Log "❌ Unhealthy containers found: $unhealthyContainers" "ERROR"
                return $false
            }
            else {
                Write-Log "✅ All containers are healthy" "SUCCESS"
                return $true
            }
        }
        else {
            Write-Log "❌ No containers found" "ERROR"
            return $false
        }
    }
    catch {
        Write-Log "❌ Docker is not running or not accessible: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Main execution
function Main {
    Write-Log "Starting ABYA Ecosystem health check..."
    Write-Log "Endpoint: $HealthEndpoint"
    Write-Log "Timeout: ${HealthTimeout}s"
    Write-Log "Max retries: $MaxRetries"
    
    $healthCheckPassed = $false
    $containerCheckPassed = $false
    
    # Perform health checks
    if ($Detailed) {
        $healthCheckPassed = Test-DetailedHealth
    }
    else {
        $healthCheckPassed = Test-Health
    }
    
    # Check container health
    $containerCheckPassed = Test-ContainerHealth
    
    # Overall result
    if ($healthCheckPassed -and $containerCheckPassed) {
        Write-Log "🎉 All health checks completed successfully" "SUCCESS"
        exit 0
    }
    else {
        Write-Log "💥 Health check failed" "ERROR"
        
        if (-not $healthCheckPassed) {
            Write-Log "- Application health check failed" "ERROR"
        }
        
        if (-not $containerCheckPassed) {
            Write-Log "- Container health check failed" "ERROR"
        }
        
        exit 1
    }
}

# Run main function
Main