# ABYA Ecosystem SSL Certificate Setup Script (PowerShell)
# Handles SSL certificate generation, installation, and renewal

param(
    [string]$Domain = "localhost",
    [string]$CertPath = "./certs",
    [string]$CertProvider = "self-signed", # self-signed, letsencrypt, custom
    [string]$Email = "",
    [switch]$Staging,
    [switch]$Force
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
    
    Write-Host "[$timestamp] [SSL] $Message" -ForegroundColor $color
}

# Create certificate directory
function New-CertificateDirectory {
    param([string]$Path)
    
    if (-not (Test-Path $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
        Write-Log "Created certificate directory: $Path" -Level "SUCCESS"
    }
    
    # Set appropriate permissions (Windows)
    try {
        $acl = Get-Acl $Path
        $acl.SetAccessRuleProtection($true, $false)
        $adminRule = New-Object System.Security.AccessControl.FileSystemAccessRule("Administrators", "FullControl", "ContainerInherit,ObjectInherit", "None", "Allow")
        $systemRule = New-Object System.Security.AccessControl.FileSystemAccessRule("SYSTEM", "FullControl", "ContainerInherit,ObjectInherit", "None", "Allow")
        $acl.SetAccessRule($adminRule)
        $acl.SetAccessRule($systemRule)
        Set-Acl -Path $Path -AclObject $acl
        Write-Log "Set secure permissions on certificate directory" -Level "SUCCESS"
    }
    catch {
        Write-Log "Warning: Could not set secure permissions: $($_.Exception.Message)" -Level "WARN"
    }
}

# Generate self-signed certificate
function New-SelfSignedCertificate {
    param(
        [string]$Domain,
        [string]$CertPath
    )
    
    Write-Log "Generating self-signed certificate for domain: $Domain"
    
    $certFile = Join-Path $CertPath "cert.pem"
    $keyFile = Join-Path $CertPath "key.pem"
    $chainFile = Join-Path $CertPath "chain.pem"
    
    # Check if OpenSSL is available
    try {
        $opensslVersion = openssl version 2>$null
        if (-not $opensslVersion) {
            throw "OpenSSL not found"
        }
        Write-Log "Using OpenSSL: $opensslVersion" -Level "INFO"
    }
    catch {
        Write-Log "❌ OpenSSL not found. Please install OpenSSL or use Windows certificate tools." -Level "ERROR"
        return $false
    }
    
    # Generate private key
    Write-Log "Generating private key..."
    $keyGenResult = & openssl genrsa -out $keyFile 2048 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Log "❌ Failed to generate private key: $keyGenResult" -Level "ERROR"
        return $false
    }
    
    # Create certificate signing request configuration
    $csrConfig = @"
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req

[dn]
C=US
ST=State
L=City
O=ABYA Ecosystem
OU=Development
CN=$Domain

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = $Domain
DNS.2 = *.$Domain
DNS.3 = localhost
IP.1 = 127.0.0.1
IP.2 = ::1
"@
    
    $csrConfigFile = Join-Path $CertPath "csr.conf"
    $csrConfig | Out-File -FilePath $csrConfigFile -Encoding UTF8
    
    # Generate certificate
    Write-Log "Generating certificate..."
    $certGenResult = & openssl req -new -x509 -key $keyFile -out $certFile -days 365 -config $csrConfigFile -extensions v3_req 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Log "❌ Failed to generate certificate: $certGenResult" -Level "ERROR"
        return $false
    }
    
    # Create chain file (same as cert for self-signed)
    Copy-Item $certFile $chainFile
    
    # Generate DH parameters
    Write-Log "Generating DH parameters (this may take a while)..."
    $dhparamFile = Join-Path $CertPath "dhparam.pem"
    $dhGenResult = & openssl dhparam -out $dhparamFile 2048 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Log "⚠️ Failed to generate DH parameters: $dhGenResult" -Level "WARN"
    }
    
    # Clean up temporary files
    Remove-Item $csrConfigFile -ErrorAction SilentlyContinue
    
    Write-Log "✅ Self-signed certificate generated successfully" -Level "SUCCESS"
    return $true
}

# Setup Let's Encrypt certificate
function New-LetsEncryptCertificate {
    param(
        [string]$Domain,
        [string]$Email,
        [string]$CertPath,
        [bool]$Staging
    )
    
    Write-Log "Setting up Let's Encrypt certificate for domain: $Domain"
    
    # Check if certbot is available
    try {
        $certbotVersion = certbot --version 2>$null
        if (-not $certbotVersion) {
            throw "Certbot not found"
        }
        Write-Log "Using Certbot: $certbotVersion" -Level "INFO"
    }
    catch {
        Write-Log "❌ Certbot not found. Please install Certbot for Let's Encrypt certificates." -Level "ERROR"
        Write-Log "Install from: https://certbot.eff.org/" -Level "INFO"
        return $false
    }
    
    if (-not $Email) {
        Write-Log "❌ Email address required for Let's Encrypt certificates" -Level "ERROR"
        return $false
    }
    
    # Build certbot command
    $certbotArgs = @(
        "certonly",
        "--webroot",
        "--webroot-path", "/usr/share/nginx/html",
        "--email", $Email,
        "--agree-tos",
        "--no-eff-email",
        "-d", $Domain
    )
    
    if ($Staging) {
        $certbotArgs += "--staging"
        Write-Log "Using Let's Encrypt staging environment" -Level "INFO"
    }
    
    # Run certbot
    Write-Log "Running Certbot..."
    $certbotResult = & certbot @certbotArgs 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Log "❌ Certbot failed: $certbotResult" -Level "ERROR"
        return $false
    }
    
    # Copy certificates to our cert path
    $letsencryptPath = "/etc/letsencrypt/live/$Domain"
    Copy-Item "$letsencryptPath/fullchain.pem" (Join-Path $CertPath "cert.pem")
    Copy-Item "$letsencryptPath/privkey.pem" (Join-Path $CertPath "key.pem")
    Copy-Item "$letsencryptPath/chain.pem" (Join-Path $CertPath "chain.pem")
    
    Write-Log "✅ Let's Encrypt certificate setup successfully" -Level "SUCCESS"
    return $true
}

# Validate certificate
function Test-Certificate {
    param(
        [string]$CertPath,
        [string]$Domain
    )
    
    $certFile = Join-Path $CertPath "cert.pem"
    $keyFile = Join-Path $CertPath "key.pem"
    
    if (-not (Test-Path $certFile) -or -not (Test-Path $keyFile)) {
        Write-Log "❌ Certificate files not found" -Level "ERROR"
        return $false
    }
    
    try {
        # Check certificate validity
        $certInfo = & openssl x509 -in $certFile -text -noout 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Log "❌ Invalid certificate: $certInfo" -Level "ERROR"
            return $false
        }
        
        # Check key validity
        $keyInfo = & openssl rsa -in $keyFile -check -noout 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Log "❌ Invalid private key: $keyInfo" -Level "ERROR"
            return $false
        }
        
        # Check if certificate and key match
        $certModulus = & openssl x509 -noout -modulus -in $certFile 2>&1
        $keyModulus = & openssl rsa -noout -modulus -in $keyFile 2>&1
        
        if ($certModulus -ne $keyModulus) {
            Write-Log "❌ Certificate and private key do not match" -Level "ERROR"
            return $false
        }
        
        Write-Log "✅ Certificate validation passed" -Level "SUCCESS"
        return $true
    }
    catch {
        Write-Log "❌ Certificate validation failed: $($_.Exception.Message)" -Level "ERROR"
        return $false
    }
}

# Main execution
function Main {
    Write-Log "Starting ABYA Ecosystem SSL setup..."
    Write-Log "Domain: $Domain"
    Write-Log "Certificate provider: $CertProvider"
    Write-Log "Certificate path: $CertPath"
    
    # Create certificate directory
    New-CertificateDirectory -Path $CertPath
    
    # Check if certificates already exist
    $certFile = Join-Path $CertPath "cert.pem"
    $keyFile = Join-Path $CertPath "key.pem"
    
    if ((Test-Path $certFile) -and (Test-Path $keyFile) -and -not $Force) {
        Write-Log "Certificates already exist. Use -Force to regenerate." -Level "WARN"
        
        if (Test-Certificate -CertPath $CertPath -Domain $Domain) {
            Write-Log "Existing certificates are valid" -Level "SUCCESS"
            return
        }
        else {
            Write-Log "Existing certificates are invalid, regenerating..." -Level "WARN"
        }
    }
    
    # Generate certificates based on provider
    $success = switch ($CertProvider) {
        "self-signed" { 
            New-SelfSignedCertificate -Domain $Domain -CertPath $CertPath 
        }
        "letsencrypt" { 
            New-LetsEncryptCertificate -Domain $Domain -Email $Email -CertPath $CertPath -Staging $Staging 
        }
        "custom" {
            Write-Log "Custom certificate provider selected. Please manually place cert.pem and key.pem in $CertPath" -Level "INFO"
            $true
        }
        default {
            Write-Log "❌ Unknown certificate provider: $CertProvider" -Level "ERROR"
            $false
        }
    }
    
    if ($success) {
        # Validate the certificates
        if (Test-Certificate -CertPath $CertPath -Domain $Domain) {
            Write-Log "🎉 SSL setup completed successfully!" -Level "SUCCESS"
            
            # Display certificate information
            Write-Log "Certificate files created:" -Level "INFO"
            Write-Log "  - Certificate: $(Join-Path $CertPath 'cert.pem')" -Level "INFO"
            Write-Log "  - Private Key: $(Join-Path $CertPath 'key.pem')" -Level "INFO"
            Write-Log "  - Chain: $(Join-Path $CertPath 'chain.pem')" -Level "INFO"
            
            if (Test-Path (Join-Path $CertPath "dhparam.pem")) {
                Write-Log "  - DH Parameters: $(Join-Path $CertPath 'dhparam.pem')" -Level "INFO"
            }
        }
        else {
            Write-Log "💥 SSL setup failed validation" -Level "ERROR"
            exit 1
        }
    }
    else {
        Write-Log "💥 SSL setup failed" -Level "ERROR"
        exit 1
    }
}

# Execute main function
Main