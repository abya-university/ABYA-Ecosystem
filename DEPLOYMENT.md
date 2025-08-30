# ABYA Ecosystem - Digital Ocean Deployment Guide

## Domain: passport.abyauniversity.com

### Prerequisites

1. **Digital Ocean Droplet** with Ubuntu 20.04+ LTS
2. **Domain DNS** pointing to your droplet IP
3. **SSL Certificate** (Let's Encrypt recommended)

### Quick Deployment Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/abya-university/ABYA-Ecosystem.git
   cd ABYA-Ecosystem
   ```

2. **Run the deployment script:**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

3. **Set up SSL (Let's Encrypt):**
   ```bash
   # Install certbot
   sudo apt update
   sudo apt install certbot python3-certbot-nginx
   
   # Get SSL certificate
   sudo certbot --nginx -d passport.abyauniversity.com
   
   # Copy certificates to project
   sudo cp /etc/letsencrypt/live/passport.abyauniversity.com/fullchain.pem ./certs/passport.abyauniversity.com.crt
   sudo cp /etc/letsencrypt/live/passport.abyauniversity.com/privkey.pem ./certs/passport.abyauniversity.com.key
   sudo chown $USER:$USER ./certs/*
   
   # Restart containers
   docker-compose --env-file .env.production restart
   ```

### Environment Variables

Create `.env.production` with your production values:

```bash
# Blockchain Configuration
VITE_APP_RPC_URL=https://mainnet.skalenodes.com/v1/honorable-steel-rasalhague
VITE_APP_CHAIN_ID=1020352220

# Smart Contract Addresses (your deployed contracts)
VITE_APP_LMS_TOKEN_ADDRESS=0x742d35Cc6634C0532925a3b8D4C9db96c4b5Da5c
VITE_APP_TREASURY_ADDRESS=0x8A791620dd6260079BF849Dc5567aDC3F2FdC318
# ... (other contract addresses)

# IPFS Configuration
VITE_APP_PINATA_API_KEY=your_actual_pinata_api_key
VITE_APP_PINATA_SECRET_KEY=your_actual_pinata_secret_key

# Security
VITE_APP_ALLOWED_ORIGINS=https://passport.abyauniversity.com

# Feature Flags
VITE_APP_ENABLE_TESTNET=false
VITE_APP_DEBUG_MODE=false
```

### Monitoring

- **Health Check:** `curl https://passport.abyauniversity.com/health`
- **Logs:** `docker-compose logs -f`
- **Status:** `docker-compose ps`

### Security Checklist

- ✅ SSL/TLS enabled
- ✅ Non-root user in containers
- ✅ Security headers configured
- ✅ Rate limiting enabled
- ✅ CORS properly configured
- ✅ Environment variables secured

### Backup Strategy

1. **Database:** Redis data is persisted in Docker volumes
2. **SSL Certificates:** Backed up in `./certs/` directory
3. **Logs:** Available in `./logs/` directory

### Troubleshooting

1. **Container won't start:**
   ```bash
   docker-compose logs frontend
   ```

2. **SSL issues:**
   ```bash
   sudo certbot renew --dry-run
   ```

3. **Performance issues:**
   ```bash
   docker stats
   ```

### Updates

To update the application:
```bash
git pull origin main
docker-compose --env-file .env.production build --no-cache
docker-compose --env-file .env.production up -d
```