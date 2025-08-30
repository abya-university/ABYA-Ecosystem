#!/bin/sh
# Runtime configuration injection for ABYA Ecosystem
# This script injects environment variables into the built application at runtime
# Note: This runs inside the Linux container, so it uses sh syntax

set -e

echo "🚀 Starting ABYA Ecosystem runtime configuration..."

# Define the target file for runtime configuration
CONFIG_FILE="/usr/share/nginx/html/runtime-config.js"
INDEX_FILE="/usr/share/nginx/html/index.html"

# Create runtime configuration file
cat > "$CONFIG_FILE" << EOF
// ABYA Ecosystem Runtime Configuration
// This file is generated at container startup and contains environment-specific settings
window.__RUNTIME_CONFIG__ = {
  // Blockchain Configuration
  RPC_URL: '${VITE_APP_RPC_URL:-https://testnet.skalenodes.com/v1/juicy-low-small-testnet}',
  CHAIN_ID: '${VITE_APP_CHAIN_ID:-1351057110}',
  
  // Smart Contract Addresses
  LMS_TOKEN_ADDRESS: '${VITE_APP_LMS_TOKEN_ADDRESS:-}',
  TREASURY_ADDRESS: '${VITE_APP_TREASURY_ADDRESS:-}',
  VESTING_ADDRESS: '${VITE_APP_VESTING_ADDRESS:-}',
  LIQUIDITY_ADDRESS: '${VITE_APP_LIQUIDITY_ADDRESS:-}',
  SFUEL_DISTRIBUTOR_ADDRESS: '${VITE_APP_SFUEL_DISTRIBUTOR_ADDRESS:-}',
  COMMUNITY_ADDRESS: '${VITE_APP_COMMUNITY_ADDRESS:-}',
  ECOSYSTEM_ADDRESS: '${VITE_APP_ECOSYSTEM_ADDRESS:-}',
  DID_REGISTRY_ADDRESS: '${VITE_APP_DID_REGISTRY_ADDRESS:-}',
  
  // IPFS Configuration
  PINATA_API_KEY: '${VITE_APP_PINATA_API_KEY:-}',
  PINATA_SECRET_KEY: '${VITE_APP_PINATA_SECRET_KEY:-}',
  IPFS_GATEWAY: '${VITE_APP_IPFS_GATEWAY:-https://gateway.pinata.cloud/ipfs/}',
  
  // Feature Flags
  ENABLE_TESTNET: ${VITE_APP_ENABLE_TESTNET:-true},
  DEBUG_MODE: ${VITE_APP_DEBUG_MODE:-false},
  
  // Security
  ALLOWED_ORIGINS: '${VITE_APP_ALLOWED_ORIGINS:-*}',
  
  // Fallback Configuration
  FALLBACK_RPC_URL: '${VITE_APP_FALLBACK_RPC_URL:-}',
  BACKUP_RPC_URL: '${VITE_APP_BACKUP_RPC_URL:-}',
  
  // Build Information
  BUILD_TIME: '$(date -u +"%Y-%m-%dT%H:%M:%SZ")',
  VERSION: '${APP_VERSION:-1.0.0}',
  ENVIRONMENT: '${NODE_ENV:-production}'
};

// Log configuration loading (only in debug mode)
if (window.__RUNTIME_CONFIG__.DEBUG_MODE) {
  console.log('🔧 ABYA Runtime Configuration Loaded:', window.__RUNTIME_CONFIG__);
}
EOF

echo "✅ Runtime configuration file created: $CONFIG_FILE"

# Inject the runtime config script into index.html if not already present
if [ -f "$INDEX_FILE" ]; then
  # Check if runtime config is already injected
  if ! grep -q "runtime-config.js" "$INDEX_FILE"; then
    echo "📝 Injecting runtime configuration into index.html..."
    
    # Create a temporary file with the script injection
    sed 's|</head>|  <script src="/runtime-config.js"></script>\n  </head>|' "$INDEX_FILE" > "$INDEX_FILE.tmp"
    mv "$INDEX_FILE.tmp" "$INDEX_FILE"
    
    echo "✅ Runtime configuration injected into index.html"
  else
    echo "ℹ️  Runtime configuration already present in index.html"
  fi
else
  echo "⚠️  Warning: index.html not found at $INDEX_FILE"
fi

# Set proper permissions
chmod 644 "$CONFIG_FILE"
if [ -f "$INDEX_FILE" ]; then
  chmod 644 "$INDEX_FILE"
fi

# Validate configuration
echo "🔍 Validating runtime configuration..."

# Check if critical environment variables are set
MISSING_VARS=""

if [ -z "${VITE_APP_RPC_URL:-}" ]; then
  echo "⚠️  Warning: VITE_APP_RPC_URL not set, using default"
fi

if [ -z "${VITE_APP_PINATA_API_KEY:-}" ]; then
  echo "⚠️  Warning: VITE_APP_PINATA_API_KEY not set, IPFS uploads may not work"
  MISSING_VARS="$MISSING_VARS VITE_APP_PINATA_API_KEY"
fi

if [ -z "${VITE_APP_PINATA_SECRET_KEY:-}" ]; then
  echo "⚠️  Warning: VITE_APP_PINATA_SECRET_KEY not set, IPFS uploads may not work"
  MISSING_VARS="$MISSING_VARS VITE_APP_PINATA_SECRET_KEY"
fi

# Log contract addresses status
CONTRACT_ADDRESSES="LMS_TOKEN TREASURY VESTING LIQUIDITY SFUEL_DISTRIBUTOR COMMUNITY ECOSYSTEM DID_REGISTRY"
MISSING_CONTRACTS=""

for contract in $CONTRACT_ADDRESSES; do
  var_name="VITE_APP_${contract}_ADDRESS"
  eval "var_value=\${$var_name:-}"
  if [ -z "$var_value" ]; then
    MISSING_CONTRACTS="$MISSING_CONTRACTS $contract"
  fi
done

if [ -n "$MISSING_CONTRACTS" ]; then
  echo "⚠️  Warning: Missing contract addresses:$MISSING_CONTRACTS"
  echo "   Smart contract interactions may not work until addresses are configured"
fi

# Create a health check file
cat > "/usr/share/nginx/html/health" << EOF
{
  "status": "healthy",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "version": "${APP_VERSION:-1.0.0}",
  "environment": "${NODE_ENV:-production}",
  "config_loaded": true,
  "missing_vars": "$MISSING_VARS",
  "missing_contracts": "$MISSING_CONTRACTS"
}
EOF

echo "✅ Health check file created"
echo "🎉 ABYA Ecosystem runtime configuration completed successfully!"

# Print configuration summary
echo ""
echo "📋 Configuration Summary:"
echo "   RPC URL: ${VITE_APP_RPC_URL:-https://testnet.skalenodes.com/v1/juicy-low-small-testnet}"
echo "   Chain ID: ${VITE_APP_CHAIN_ID:-1351057110}"
echo "   IPFS Gateway: ${VITE_APP_IPFS_GATEWAY:-https://gateway.pinata.cloud/ipfs/}"
echo "   Debug Mode: ${VITE_APP_DEBUG_MODE:-false}"
echo "   Environment: ${NODE_ENV:-production}"
echo ""