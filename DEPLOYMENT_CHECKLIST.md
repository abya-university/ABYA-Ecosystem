# 🚀 Digital Ocean Deployment Checklist

## ✅ Pre-Deployment Checklist (Before pushing to GitHub)

### 1. Environment Configuration
- [x] `.env.production` configured with correct domain (`passport.abyauniversity.com`)
- [x] `.env.production.template` created for server deployment
- [x] Contract addresses updated in environment files
- [x] SKALE mainnet RPC URLs configured
- [x] Pinata API keys placeholders ready (to be updated on server)

### 2. Docker Configuration
- [x] `docker-compose.yml` updated with latest nginx (1.25-alpine)
- [x] `Dockerfile` updated with Node.js 20 and modern security practices
- [x] Domain configured in Traefik labels (`passport.abyauniversity.com`)
- [x] Health checks configured
- [x] Security settings optimized

### 3. Nginx Configuration
- [x] Modern security headers added
- [x] Web3-specific CSP configured for wallet integrations
- [x] CORS settings configured for the domain
- [x] SSL/TLS settings ready

### 4. Documentation
- [x] `DIGITAL_OCEAN_DEPLOYMENT.md` guide created
- [x] `deploy.sh` script created for easy deployment
- [x] Environment template documented

### 5. Security
- [x] `.gitignore` configured to exclude sensitive files
- [x] SSL certificate directory structure ready
- [x] Non-root user configuration in Docker
- [x] Security headers and CSP configured

## 🔧 What to do on Digital Ocean Droplet

### 1. Server Setup
```bash
# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install additional tools
sudo apt update && sudo apt install -y git curl nginx certbot python3-certbot-nginx
```

### 2. Clone and Configure
```bash
# Clone your repository
git clone https://github.com/YOUR_USERNAME/ABYA-Ecosystem.git
cd ABYA-Ecosystem

# Copy and configure environment
cp .env.production.template .env
nano .env  # Update with your actual Pinata API keys
```

### 3. SSL Certificate
```bash
# Get SSL certificate
sudo certbot certonly --nginx -d passport.abyauniversity.com

# Copy certificates for Docker
mkdir -p certs
sudo cp /etc/letsencrypt/live/passport.abyauniversity.com/fullchain.pem certs/
sudo cp /etc/letsencrypt/live/passport.abyauniversity.com/privkey.pem certs/
sudo chown -R $USER:$USER certs/
```

### 4. Deploy
```bash
# Make deploy script executable
chmod +x deploy.sh

# Deploy the application
./deploy.sh
```

### 5. Verify
```bash
# Check health
curl -f http://localhost/health

# Check services
docker-compose ps

# View logs
docker-compose logs -f
```

## 🔍 Important Notes

### DNS Configuration
- Ensure `passport.abyauniversity.com` points to your Digital Ocean droplet IP
- Allow 24 hours for DNS propagation

### Firewall Configuration
```bash
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### Environment Variables to Update on Server
When you copy `.env.production.template` to `.env` on the server, update:
- `VITE_APP_PINATA_API_KEY=your_actual_pinata_api_key`
- `VITE_APP_PINATA_SECRET_KEY=your_actual_pinata_secret_key`
- Contract addresses (if different from defaults)

### Monitoring
- Application: `https://passport.abyauniversity.com/health`
- Logs: `docker-compose logs -f`
- Resources: `docker stats`

## 🚨 Troubleshooting

### Common Issues
1. **Port conflicts**: Stop system nginx if running
2. **Permission errors**: Check file ownership with `sudo chown -R $USER:$USER .`
3. **SSL issues**: Verify domain DNS and certificate paths
4. **Container startup**: Check logs with `docker-compose logs [service]`

### Support
- Deployment guide: `docs/DIGITAL_OCEAN_DEPLOYMENT.md`
- Docker logs: `docker-compose logs -f`
- Service status: `docker-compose ps`

---

## ✅ Ready to Push to GitHub!

Your application is now ready for deployment. The configuration includes:
- ✅ Modern Docker setup with latest versions
- ✅ Production-ready nginx configuration
- ✅ SSL/TLS support with Let's Encrypt
- ✅ Web3 wallet integration support
- ✅ Comprehensive deployment documentation
- ✅ Automated deployment script

**Next Steps:**
1. Push your changes to GitHub
2. Follow the Digital Ocean deployment guide
3. Update environment variables on the server
4. Deploy using the provided script