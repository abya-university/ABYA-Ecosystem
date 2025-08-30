# ABYA Ecosystem Health Check Script (PowerShell)
# Comprehensive health checking for containerized application

param(
    [string]$HealthEndpoint = $env:HEALTH_ENDPOINT ?? "http://localhost/health",
    [int]$Timeout = [int]($env:HEALTH_TIMEOUT ?? "10"),
    [int]$MaxRetries = [int]($env:HEALTH_MAX_RETRIES ?? "3"),
    [int]$RetryDelay = [int]($env:HEALTH_RETRY_DELAY ?? "2"),
    [switch]$Detailed
)

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
    param(
        [string]$Endpoint,
        [int]$TimeoutSeconds,
        [int]$Retries,
        [int]$DelaySeconds
    )
    
    for ($attempt = 1; $attempt -le $Retries; $attempt++) {
        Write-Log "Health check attempt $attempt/$Retries"
        
        try {
            $response = Invoke-WebRequest -Uri $Endpoint -TimeoutSec $TimeoutSeconds -UseBasicParsing -ErrorAction Stop
            
            if ($response.StatusCode -eq 200) {
                Write-Log "✅ Health check passed" -Level "SUCCESS"
                return $true
            }
        }
        catch {
            Write-Log "⚠️ Health check failed (attempt $attempt/$Retries): $($_.Exception.Message)" -Level "WARN"
        }
        
        if ($attempt -lt $Retries) {
            Write-Log "Retrying in ${DelaySeconds}s..."
            Start-Sleep -Seconds $DelaySeconds
        }
    }
    
    Write-Log "❌ Health check failed after $Retries attempts" -Level "ERROR"
    return $false
}

# Detailed health check with JSON response
function Test-DetailedHealth {
    param(
        [string]$Endpoint,
        [int]$TimeoutSeconds
    )
    
    Write-Log "Performing detailed health check..."
    
    try {
        $response = Invoke-WebRequest -Uri $Endpoint -TimeoutSec $TimeoutSeconds -UseBasicParsing -ErrorAction Stop
        
        Write-Log "HTTP Status: $($response.StatusCode)"
        
        if ($response.StatusCode -eq 200) {
            Write-Log "✅ Service is healthy" -Level "SUCCESS"
            
            # Try to parse JSON response
            try {
                $jsonContent = $response.Content | ConvertFrom-Json
                Write-Log "Health details:"
                $jsonContent | ConvertTo-Json -Depth 3 | Write-Host
            }
            catch {
                Write-Log "Health response: $($response.Content)"
            }
            
            return $true
        }
        else {
            Write-Log "❌ Service is unhealthy (HTTP $($response.StatusCode))" -Level "ERROR"
            Write-Log "Response: $($response.Content)"
            return $false
        }
    }
    catch {
        Write-Log "❌ Service is unhealthy: $($_.Exception.Message)" -Level "ERROR"
        return $false
    }
}

# Main execution
function Main {
    Write-Log "Starting ABYA Ecosystem health check..."
    Write-Log "Endpoint: $HealthEndpoint"
    Write-Log "Timeout: ${Timeout}s"
    Write-Log "Max retries: $MaxRetries"
    
    $success = if ($Detailed) {
        Test-DetailedHealth -Endpoint $HealthEndpoint -TimeoutSeconds $Timeout
    }
    else {
        Test-Health -Endpoint $HealthEndpoint -TimeoutSeconds $Timeout -Retries $MaxRetries -DelaySeconds $RetryDelay
    }
    
    if ($success) {
        Write-Log "🎉 Health check completed successfully" -Level "SUCCESS"
        exit 0
    }
    else {
        Write-Log "💥 Health check failed" -Level "ERROR"
        exit 1
    }
}

# Execute main function
Main