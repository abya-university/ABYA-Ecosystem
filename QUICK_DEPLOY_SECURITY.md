# Quick Deployment Guide - CVE-2025-49844 Security Patch

## Immediate Action Required

Your DigitalOcean droplet `ubuntu-s-2vcpu-4gb-amd-blr1-01` has a critical Redis vulnerability that needs to be patched immediately.

## Quick Deploy (Recommended)

### Option 1: Automated Script (Easiest)

```powershell
# Run the automated security update script
.\scripts\security-update-redis.ps1 -Production
```

This script will:
- Generate a secure Redis password
- Backup your current Redis data
- Update to Redis 7.2.11 (patched version)
- Apply security configurations
- Restart services with the secure setup

### Option 2: Manual Deployment

1. **SSH into your DigitalOcean droplet:**
   ```bash
   ssh root@your-droplet-ip
   ```

2. **Navigate to your project directory:**
   ```bash
   cd /path/to/ABYA-Ecosystem
   ```

3. **Pull the latest changes:**
   ```bash
   git pull origin deployment
   ```

4. **Set Redis password:**
   ```bash
   # Generate a secure password
   REDIS_PASSWORD=$(openssl rand -base64 32)
   
   # Add to .env file
   echo "REDIS_PASSWORD=$REDIS_PASSWORD" >> .env
   ```

5. **Update and restart services:**
   ```bash
   # Pull the new Redis image
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml pull redis
   
   # Restart with new configuration
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

6. **Verify the update:**
   ```bash
   # Check Redis version (should be 7.2.11)
   docker exec abya-redis redis-cli INFO SERVER | grep redis_version
   
   # Test authentication
   docker exec abya-redis redis-cli -a $REDIS_PASSWORD PING
   ```

## What Was Changed

### Files Modified:
1. ✅ `docker-compose.yml` - Updated Redis image to 7.2.11-alpine
2. ✅ `docker-compose.prod.yml` - Added security configurations
3. ✅ `redis/redis.conf` - Enabled protected mode and authentication
4. ✅ `.env.example` - Added Redis password configuration

### Security Improvements:
- ✅ Updated to Redis 7.2.11 (patched for CVE-2025-49844)
- ✅ Enabled password authentication
- ✅ Enabled protected mode
- ✅ Bound Redis to localhost only (127.0.0.1)
- ✅ Disabled dangerous commands (FLUSHDB, FLUSHALL, DEBUG)
- ✅ Added container security options

## Verification

After deployment, verify everything is working:

```bash
# 1. Check container status
docker ps | grep redis

# 2. Check Redis version
docker exec abya-redis redis-cli INFO SERVER | grep redis_version
# Expected output: redis_version:7.2.11

# 3. Check Redis logs for errors
docker logs abya-redis --tail 50

# 4. Test Redis connectivity
docker exec abya-redis redis-cli -a $REDIS_PASSWORD PING
# Expected output: PONG

# 5. Check application connectivity
docker logs abya-frontend --tail 50
```

## If Your Application Uses Redis

Update your application code to use Redis authentication:

### Node.js Example:
```javascript
const redis = require('redis');
const client = redis.createClient({
  host: 'redis',
  port: 6379,
  password: process.env.REDIS_PASSWORD
});
```

### Python Example:
```python
import redis
r = redis.Redis(
    host='redis',
    port=6379,
    password=os.environ['REDIS_PASSWORD']
)
```

## Troubleshooting

### Issue: Application can't connect to Redis

**Solution:** Make sure your application container has access to the `REDIS_PASSWORD` environment variable:

```yaml
# In docker-compose.yml
services:
  your-app:
    environment:
      - REDIS_PASSWORD=${REDIS_PASSWORD}
```

### Issue: "NOAUTH Authentication required"

**Solution:** Your application is trying to connect without authentication. Update your Redis client configuration to include the password.

### Issue: "Connection refused"

**Solution:** Check if Redis container is running:
```bash
docker ps | grep redis
docker logs abya-redis
```

## Notify DigitalOcean

After successful deployment, you can respond to DigitalOcean's email with:

```
Subject: Re: URGENT: Security Alert - Redis/Valkey action required (CVE-2025-49844)

Hello DigitalOcean Security Team,

I have successfully updated the Redis instance on droplet ubuntu-s-2vcpu-4gb-amd-blr1-01 to address CVE-2025-49844.

Actions taken:
- Updated Redis to version 7.2.11 (patched version)
- Enabled password authentication
- Enabled protected mode
- Restricted network access to localhost only
- Disabled dangerous commands

The system has been verified and is now secure.

Thank you for the notification.
```

## Additional Resources

- Full deployment guide: `SECURITY_UPDATE_CVE-2025-49844.md`
- Redis configuration: `redis/redis.conf`
- Environment variables: `.env.example`

## Emergency Rollback

If you need to rollback (not recommended):

```bash
# Stop services
docker-compose down

# Edit docker-compose.yml and change Redis version back
# Then restart
docker-compose up -d
```

**Note:** Rolling back leaves your system vulnerable. Only do this if absolutely necessary and patch immediately.

## Support

If you need help:
1. Check the detailed guide: `SECURITY_UPDATE_CVE-2025-49844.md`
2. Review Redis logs: `docker logs abya-redis`
3. Contact DigitalOcean support if needed
4. File an issue in the repository

---

**Status**: ✅ Files updated and ready for deployment
**Priority**: 🔴 CRITICAL - Deploy immediately
**Estimated Time**: 5-10 minutes
