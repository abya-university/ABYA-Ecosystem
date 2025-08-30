# ABYA Ecosystem Security Scanning Script (PowerShell)
# Comprehensive security scanning for Docker images and containers

param(
    [string]$ImageName = "abya-ecosystem:latest",
    [string]$ScanTool = "trivy", # trivy, snyk, or docker-scout
    [switch]$FailOnHigh,
    [switch]$FailOnCritical = $true,
    [string]$OutputFormat = "table", # table, json, sarif
    [string]$OutputFile = ""
)

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
    
    Write-Host "[$timestamp] [SECURITY] $Message" -ForegroundColor $color
}

# Check if required tools are installed
function Test-SecurityTools {
    $tools = @()
    
    # Check for Trivy
    try {
        $trivyVersion = trivy --version 2>$null
        if ($trivyVersion) {
            $tools += "trivy"
            Write-Log "✅ Trivy found: $($trivyVersion -split "`n" | Select-Object -First 1)" -Level "SUCCESS"
        }
    }
    catch {
        Write-Log "⚠️ Trivy not found" -Level "WARN"
    }
    
    # Check for Docker Scout
    try {
        $scoutVersion = docker scout version 2>$null
        if ($scoutVersion) {
            $tools += "docker-scout"
            Write-Log "✅ Docker Scout found" -Level "SUCCESS"
        }
    }
    catch {
        Write-Log "⚠️ Docker Scout not found" -Level "WARN"
    }
    
    # Check for Snyk
    try {
        $snykVersion = snyk --version 2>$null
        if ($snykVersion) {
            $tools += "snyk"
            Write-Log "✅ Snyk found: $snykVersion" -Level "SUCCESS"
        }
    }
    catch {
        Write-Log "⚠️ Snyk not found" -Level "WARN"
    }
    
    return $tools
}

# Run Trivy scan
function Invoke-TrivyScan {
    param(
        [string]$Image,
        [string]$Format,
        [string]$Output
    )
    
    Write-Log "Running Trivy vulnerability scan..."
    
    $trivyArgs = @(
        "image",
        "--severity", "UNKNOWN,LOW,MEDIUM,HIGH,CRITICAL",
        "--format", $Format
    )
    
    if ($Output) {
        $trivyArgs += @("--output", $Output)
    }
    
    $trivyArgs += $Image
    
    try {
        $result = & trivy @trivyArgs
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✅ Trivy scan completed successfully" -Level "SUCCESS"
            return $true
        }
        else {
            Write-Log "❌ Trivy scan found vulnerabilities (exit code: $LASTEXITCODE)" -Level "ERROR"
            return $false
        }
    }
    catch {
        Write-Log "❌ Trivy scan failed: $($_.Exception.Message)" -Level "ERROR"
        return $false
    }
}

# Run Docker Scout scan
function Invoke-DockerScoutScan {
    param(
        [string]$Image,
        [string]$Format,
        [string]$Output
    )
    
    Write-Log "Running Docker Scout vulnerability scan..."
    
    $scoutArgs = @(
        "cves",
        $Image
    )
    
    if ($Format -eq "json") {
        $scoutArgs += "--format", "json"
    }
    
    if ($Output) {
        $scoutArgs += "--output", $Output
    }
    
    try {
        $result = & docker scout @scoutArgs
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✅ Docker Scout scan completed successfully" -Level "SUCCESS"
            return $true
        }
        else {
            Write-Log "❌ Docker Scout scan found issues (exit code: $LASTEXITCODE)" -Level "ERROR"
            return $false
        }
    }
    catch {
        Write-Log "❌ Docker Scout scan failed: $($_.Exception.Message)" -Level "ERROR"
        return $false
    }
}

# Run Snyk scan
function Invoke-SnykScan {
    param(
        [string]$Image,
        [string]$Format,
        [string]$Output
    )
    
    Write-Log "Running Snyk container scan..."
    
    $snykArgs = @(
        "container",
        "test",
        $Image,
        "--severity-threshold=medium"
    )
    
    if ($Format -eq "json") {
        $snykArgs += "--json"
    }
    
    if ($Output) {
        $snykArgs += "--json-file-output=$Output"
    }
    
    try {
        $result = & snyk @snykArgs
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✅ Snyk scan completed successfully" -Level "SUCCESS"
            return $true
        }
        else {
            Write-Log "❌ Snyk scan found vulnerabilities (exit code: $LASTEXITCODE)" -Level "ERROR"
            return $false
        }
    }
    catch {
        Write-Log "❌ Snyk scan failed: $($_.Exception.Message)" -Level "ERROR"
        return $false
    }
}

# Check image exists
function Test-ImageExists {
    param([string]$Image)
    
    try {
        $imageInfo = docker image inspect $Image 2>$null | ConvertFrom-Json
        if ($imageInfo) {
            Write-Log "✅ Image found: $Image" -Level "SUCCESS"
            return $true
        }
    }
    catch {
        Write-Log "❌ Image not found: $Image" -Level "ERROR"
        return $false
    }
    
    return $false
}

# Main execution
function Main {
    Write-Log "Starting ABYA Ecosystem security scan..."
    Write-Log "Image: $ImageName"
    Write-Log "Scan tool: $ScanTool"
    Write-Log "Output format: $OutputFormat"
    
    # Check if image exists
    if (-not (Test-ImageExists -Image $ImageName)) {
        Write-Log "❌ Cannot proceed without valid image" -Level "ERROR"
        exit 1
    }
    
    # Check available tools
    $availableTools = Test-SecurityTools
    
    if ($availableTools.Count -eq 0) {
        Write-Log "❌ No security scanning tools found. Please install Trivy, Docker Scout, or Snyk." -Level "ERROR"
        exit 1
    }
    
    # Determine which tool to use
    $toolToUse = if ($ScanTool -in $availableTools) {
        $ScanTool
    }
    elseif ("trivy" -in $availableTools) {
        "trivy"
    }
    elseif ("docker-scout" -in $availableTools) {
        "docker-scout"
    }
    elseif ("snyk" -in $availableTools) {
        "snyk"
    }
    else {
        $null
    }
    
    if (-not $toolToUse) {
        Write-Log "❌ Requested tool '$ScanTool' not available" -Level "ERROR"
        exit 1
    }
    
    Write-Log "Using security tool: $toolToUse"
    
    # Run the appropriate scan
    $scanSuccess = switch ($toolToUse) {
        "trivy" { Invoke-TrivyScan -Image $ImageName -Format $OutputFormat -Output $OutputFile }
        "docker-scout" { Invoke-DockerScoutScan -Image $ImageName -Format $OutputFormat -Output $OutputFile }
        "snyk" { Invoke-SnykScan -Image $ImageName -Format $OutputFormat -Output $OutputFile }
        default { $false }
    }
    
    # Determine exit code based on scan results and flags
    if ($scanSuccess) {
        Write-Log "🎉 Security scan completed successfully" -Level "SUCCESS"
        exit 0
    }
    else {
        if ($FailOnCritical -or $FailOnHigh) {
            Write-Log "💥 Security scan failed - vulnerabilities found" -Level "ERROR"
            exit 1
        }
        else {
            Write-Log "⚠️ Security scan found issues but continuing (fail flags not set)" -Level "WARN"
            exit 0
        }
    }
}

# Execute main function
Main