# Docker Development Workflow

## Overview

This document outlines the development workflow for the ABYA Ecosystem using Docker containers. The containerized development environment ensures consistency across different developer machines and simplifies the setup process.

## Prerequisites

- Docker Engine 24.0+
- Docker Compose 2.20+
- PowerShell 5.1+ (Windows) or Bash (Linux/Mac)
- Git
- A code editor (VS Code recommended)

## Quick Start

1. **Clone the repository**:
   ```powershell
   git clone <repository-url>
   cd ABYA-Ecosystem
   ```

2. **Copy environment variables**:
   ```powershell
   Copy-Item .env.example .env
   ```

3. **Start development environment**:
   ```powershell
   .\scripts\dev.ps1 up
   ```

4. **Access the application**:
   - Frontend: http://localhost:3000
   - Redis (optional): localhost:6379

## Development Commands

### PowerShell Commands (Recommended for Windows)

```powershell
# Start development environment
.\scripts\dev.ps1 up

# Stop development environment
.\scripts\dev.ps1 down

# View logs
.\scripts\dev.ps1 logs

# Restart services
.\scripts\dev.ps1 restart

# Clean environment (removes volumes)
.\scripts\dev.ps1 clean
```

### Development Tasks (PowerShell)

```powershell
# Build containers from scratch
.\scripts\dev.ps1 build

# Run tests
.\scripts\dev.ps1 test

# Open shell in frontend container
.\scripts\dev.ps1 shell

# Install new dependencies
.\scripts\dev.ps1 install

# Run health checks
.\scripts\healthcheck.ps1

# Run detailed health checks
.\scripts\healthcheck.ps1 -Detailed
```

### Alternative: Make Commands (if you have make installed)

```bash
# Start development environment
make dev-up

# Stop development environment
make dev-down

# View logs
make dev-logs

# Restart services
make dev-restart

# Clean environment (removes volumes)
make dev-clean
```

## Environment Configuration

### Required Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Blockchain Configuration
VITE_APP_RPC_URL=https://testnet.skalenodes.com/v1/juicy-low-small-testnet
VITE_APP_CHAIN_ID=1351057110

# Smart Contract Addresses (set after deployment)
VITE_APP_LMS_TOKEN_ADDRESS=
VITE_APP_TREASURY_ADDRESS=
VITE_APP_VESTING_ADDRESS=
VITE_APP_LIQUIDITY_ADDRESS=
VITE_APP_SFUEL_DISTRIBUTOR_ADDRESS=
VITE_APP_COMMUNITY_ADDRESS=
VITE_APP_ECOSYSTEM_ADDRESS=
VITE_APP_DID_REGISTRY_ADDRESS=

# IPFS Configuration
VITE_APP_PINATA_API_KEY=your_pinata_api_key
VITE_APP_PINATA_SECRET_KEY=your_pinata_secret_key
VITE_APP_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/

# Feature Flags
VITE_APP_ENABLE_TESTNET=true
VITE_APP_DEBUG_MODE=true

# Security
VITE_APP_ALLOWED_ORIGINS=http://localhost:3000
```

## Development Workflow

### 1. Daily Development

1. **Start your development session**:
   ```powershell
   .\scripts\dev.ps1 up
   ```

2. **Make code changes** - Hot reloading is enabled, so changes will be reflected immediately

3. **View logs** if needed:
   ```powershell
   .\scripts\dev.ps1 logs
   ```

4. **Stop when done**:
   ```powershell
   .\scripts\dev.ps1 down
   ```

### 2. Adding New Dependencies

1. **Install dependencies**:
   ```powershell
   .\scripts\dev.ps1 install
   # Follow the prompts to enter package name
   ```

   Or manually:
   ```powershell
   .\scripts\dev.ps1 shell
   npm install <package-name>
   exit
   .\scripts\dev.ps1 restart
   ```

### 3. Testing

1. **Run tests**:
   ```powershell
   .\scripts\dev.ps1 test
   ```

2. **Run specific tests**:
   ```powershell
   .\scripts\dev.ps1 shell
   npm test -- --testNamePattern="YourTest"
   exit
   ```

### 4. Debugging

1. **Access container shell**:
   ```powershell
   .\scripts\dev.ps1 shell
   ```

2. **Check container logs**:
   ```powershell
   .\scripts\dev.ps1 logs
   ```

3. **Inspect container status**:
   ```powershell
   docker-compose -f docker-compose.dev.yml ps
   ```

4. **Run health checks**:
   ```powershell
   .\scripts\healthcheck.ps1 -Detailed
   ```

## File Structure

```
ABYA-Ecosystem/
├── docker-compose.dev.yml    # Development orchestration
├── docker-compose.yml        # Production orchestration
├── Dockerfile.dev           # Development container
├── Dockerfile              # Production container
├── .dockerignore           # Docker ignore rules
├── Makefile               # Make commands (optional)
├── .env.example           # Environment template
├── .env                   # Your environment (git-ignored)
├── scripts/
│   ├── dev.ps1            # PowerShell development commands
│   ├── healthcheck.ps1    # PowerShell health check
│   └── Makefile.ps1       # PowerShell make alternative
├── nginx/                 # Nginx configurations
├── redis/                 # Redis configurations
├── docker/               # Docker utilities
└── docs/
    └── DOCKER_DEVELOPMENT.md  # This file
```

## Hot Reloading

The development environment supports hot reloading for:
- React components
- CSS/SCSS files
- JavaScript/TypeScript files
- Environment variables (requires restart)

## Volume Mounts

- **Source code**: Mounted for hot reloading
- **node_modules**: Anonymous volume to avoid conflicts
- **Redis data**: Persistent volume for development data

## Networking

- **Frontend**: Port 3000 (mapped to host)
- **Redis**: Port 6379 (mapped to host)
- **Internal network**: `abya-dev-network` for service communication

## Troubleshooting

### Common Issues

1. **Port already in use**:
   ```powershell
   # Check what's using the port
   netstat -ano | findstr :3000
   # Kill the process or change the port in docker-compose.dev.yml
   ```

2. **Container won't start**:
   ```powershell
   # Check logs
   .\scripts\dev.ps1 logs
   # Rebuild containers
   .\scripts\dev.ps1 build
   ```

3. **Hot reloading not working**:
   ```powershell
   # Restart the frontend service
   docker-compose -f docker-compose.dev.yml restart frontend-dev
   ```

4. **Permission issues**:
   ```powershell
   # Clean and rebuild
   .\scripts\dev.ps1 clean
   .\scripts\dev.ps1 build
   .\scripts\dev.ps1 up
   ```

5. **Environment variables not loading**:
   ```powershell
   # Check .env file exists and has correct values
   Get-Content .env
   # Restart containers
   .\scripts\dev.ps1 restart
   ```

6. **PowerShell execution policy issues**:
   ```powershell
   # Allow script execution (run as Administrator)
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

### Performance Tips

1. **Use Docker Desktop with WSL2** (Windows)
2. **Allocate sufficient resources** to Docker (4GB+ RAM recommended)
3. **Use SSD storage** for better I/O performance
4. **Close unnecessary applications** to free up resources

## Web3 Development

### Smart Contract Integration

1. **Deploy contracts locally**:
   ```powershell
   # In a separate PowerShell window
   npx hardhat node
   npx hardhat run scripts/deploy.js --network localhost
   ```

2. **Update contract addresses** in `.env`

3. **Restart development environment**:
   ```powershell
   .\scripts\dev.ps1 restart
   ```

### IPFS Integration

1. **Configure Pinata credentials** in `.env`
2. **Test IPFS uploads** through the application
3. **Monitor uploads** in Pinata dashboard

## Production Builds

To test production builds locally:

```powershell
# Build production image
docker build -t abya-ecosystem:latest .

# Run production container
docker run -p 8080:80 abya-ecosystem:latest
```

## Best Practices

1. **Always use PowerShell scripts** for consistency on Windows
2. **Keep .env file secure** and never commit it
3. **Regularly clean Docker resources**:
   ```powershell
   .\scripts\dev.ps1 clean
   docker system prune -f
   ```
4. **Update dependencies regularly**
5. **Test in production-like environment** before deploying

## Support

For issues with the Docker development environment:
1. Check this documentation
2. Review container logs: `.\scripts\dev.ps1 logs`
3. Try rebuilding: `.\scripts\dev.ps1 clean` then `.\scripts\dev.ps1 build` then `.\scripts\dev.ps1 up`
4. Run health checks: `.\scripts\healthcheck.ps1 -Detailed`
5. Contact the development team

## Next Steps

- Review the production deployment documentation
- Set up CI/CD pipeline
- Configure monitoring and logging
- Implement security best practices