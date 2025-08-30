# Digital Ocean Deployment Guide

This guide will help you deploy the ABYA Ecosystem to Digital Ocean using Docker Compose.

## Prerequisites

1. Digital Ocean Droplet (recommended: 2GB RAM, 2 vCPUs)
2. Domain `passport.abyauniversity.com` pointing to your droplet's IP
3. Docker and Docker Compose installed on the droplet

## Step 1: Prepare Your Droplet

### Install Docker and Docker Compose

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again to apply group changes
```

### Install additional tools
```bash
sudo apt install -y git curl nginx certbot python3-certbot-nginx
```

## Step 2: Clone and Configure

### Clone the repository
```bash
git clone https://github.com/your-username/ABYA-Ecosystem.git
cd ABYA-Ecosystem
```

### Configure environment
```bash
# Copy the production template
cp .env.production.template .env

# Edit the environment file with your actual values
nano .env
```

**Important**: Update these values in your `.env` file:
- `VITE_APP_PINATA_API_KEY` - Your actual Pinata API key
- `VITE_APP_PINATA_SECRET_KEY` - Your actual Pinata secret key
- Contract addresses if different from the defaults

## Step 3: SSL Certificate Setup

### Option A: Using Certbot (Recommended)
```bash
# Get SSL certificate for your domain
sudo certbot certonly --nginx -d passport.abyauniversity.com

# Create certs directory and copy certificates
mkdir -p certs
sudo cp /etc/letsencrypt/live/passport.abyauniversity.com/fullchain.pem certs/
sudo cp /etc/letsencrypt/live/passport.abyauniversity.com/privkey.pem certs/
sudo chown -R $USER:$USER certs/
```

### Option B: Using Docker Compose with Let's Encrypt
The application includes Traefik labels for automatic SSL certificate generation.

## Step 4: Deploy the Application

### Build and start the services
```bash
# Build and start in production mode
docker-compose up -d --build

# Check if all services are running
docker-compose ps

# View logs
docker-compose logs -f
```

### Verify deployment
```bash
# Check health endpoint
curl -f http://localhost/health

# Check if the application is accessible
curl -I http://localhost
```

## Step 5: Configure Nginx (if using external nginx)

If you want to use the system nginx as a reverse proxy:

```bash
sudo nano /etc/nginx/sites-available/passport.abyauniversity.com
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name passport.abyauniversity.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name passport.abyauniversity.com;

    ssl_certificate /etc/letsencrypt/live/passport.abyauniversity.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/passport.abyauniversity.com/privkey.pem;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/passport.abyauniversity.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Step 6: Set up Auto-renewal for SSL

```bash
# Add cron job for certificate renewal
sudo crontab -e

# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx
```

## Step 7: Monitoring and Maintenance

### View application logs
```bash
docker-compose logs -f frontend
docker-compose logs -f redis
docker-compose logs -f nginx-proxy
```

### Update the application
```bash
git pull origin main
docker-compose down
docker-compose up -d --build
```

### Backup data
```bash
# Backup Redis data
docker-compose exec redis redis-cli BGSAVE

# Copy backup files
docker cp abya-redis:/data/dump.rdb ./backup-$(date +%Y%m%d).rdb
```

## Troubleshooting

### Common Issues

1. **Port 80/443 already in use**
   ```bash
   sudo netstat -tlnp | grep :80
   sudo systemctl stop nginx  # if system nginx is running
   ```

2. **Permission denied errors**
   ```bash
   sudo chown -R $USER:$USER .
   ```

3. **Container fails to start**
   ```bash
   docker-compose logs [service-name]
   ```

4. **Domain not resolving**
   - Check DNS settings
   - Verify domain points to droplet IP
   - Wait for DNS propagation (up to 24 hours)

### Health Checks

- Application health: `curl -f https://passport.abyauniversity.com/health`
- Container status: `docker-compose ps`
- Resource usage: `docker stats`

## Security Considerations

1. **Firewall Configuration**
   ```bash
   sudo ufw allow ssh
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw enable
   ```

2. **Regular Updates**
   ```bash
   sudo apt update && sudo apt upgrade -y
   docker-compose pull
   docker-compose up -d
   ```

3. **Backup Strategy**
   - Regular database backups
   - Configuration file backups
   - SSL certificate backups

## Performance Optimization

1. **Enable Docker logging limits**
   ```bash
   # Add to /etc/docker/daemon.json
   {
     "log-driver": "json-file",
     "log-opts": {
       "max-size": "10m",
       "max-file": "3"
     }
   }
   ```

2. **Monitor resource usage**
   ```bash
   docker stats
   htop
   ```

3. **Scale services if needed**
   ```bash
   docker-compose up -d --scale frontend=2
   ```