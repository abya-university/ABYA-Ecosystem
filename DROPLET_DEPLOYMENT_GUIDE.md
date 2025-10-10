# Droplet Deployment Guide - Preserving Environment Variables

## Problem
Your droplet has local changes (environment variables in docker-compose.yml) that need to be preserved while applying the security updates.

## Solution: Smart Merge Strategy

### Step 1: Backup Your Current Configuration
```bash
# SSH to your droplet
ssh root@your-droplet-ip

# Navigate to project
cd /path/to/ABYA-Ecosystem

# Backup your current docker-compose.yml with environment variables
cp docker-compose.yml docker-compose.yml.backup
cp docker-compose.prod.yml docker-compose.prod.yml.backup 2>/dev/null || true

# Also backup .env if it exists
cp .env .env.backup 2>/dev/null || true
```

### Step 2: Extract Your Environment Variables
```bash
# Save your current environment variables to a separate file
grep -E "VITE_APP_|REDIS_PASSWORD" docker-compose.yml > my-env-vars.txt
```

### Step 3: Apply the Security Updates
```bash
# Option A: Commit your local changes first (Recommended)
git add docker-compose.yml
git commit -m "Local: Environment variables configuration"

# Now pull the security updates
git pull origin deployment

# Git will merge both commits, preserving your env vars

# OR Option B: Use git stash (if you prefer)
git stash push -m "Local environment variables"
git pull origin deployment
git stash pop

# Resolve any conflicts manually if they occur
```

### Step 4: Verify Environment Variables Are Present
```bash
# Check if your environment variables are still there
grep -E "VITE_APP_.*ADDRESS" docker-compose.yml

# If any are missing, restore from backup:
# Compare the files
diff docker-compose.yml.backup docker-compose.yml
```

### Step 5: Set Redis Password
```bash
# Generate a secure Redis password
REDIS_PASSWORD=$(openssl rand -base64 32)

# Add to .env file (this is the recommended approach)
echo "REDIS_PASSWORD=$REDIS_PASSWORD" >> .env

# Display it so you can save it securely
echo "Your Redis password is: $REDIS_PASSWORD"
# SAVE THIS PASSWORD SECURELY!
```

### Step 6: Deploy with Security Updates
```bash
# Pull the new Redis image
docker-compose -f docker-compose.yml -f docker-compose.prod.yml pull redis

# Stop services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down

# Start with updated configuration
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Step 7: Verify Everything Works
```bash
# Check Redis version (should be 7.2.11)
docker exec abya-redis redis-cli INFO SERVER | grep redis_version

# Test Redis authentication
docker exec abya-redis redis-cli -a "$REDIS_PASSWORD" PING
# Should return: PONG

# Check all containers are running
docker ps

# Check application logs
docker logs abya-frontend --tail 50

# Check Redis logs
docker logs abya-redis --tail 50
```

## Alternative: Manual Merge (If Git Merge Fails)

If you encounter merge conflicts, here's how to manually apply only the Redis changes:

```bash
# Reset to your local version
git reset --hard HEAD

# Fetch the latest changes without merging
git fetch origin deployment

# View what changed in specific files
git diff HEAD origin/deployment -- docker-compose.yml
git diff HEAD origin/deployment -- docker-compose.prod.yml
git diff HEAD origin/deployment -- redis/redis.conf

# Manually apply only the Redis-specific changes:
```

### Manual Redis Updates to Apply:

#### 1. In `docker-compose.yml`, update the Redis service:
```yaml
  redis:
    image: redis:7.2.11-alpine  # Change this line
    ports:
      - "127.0.0.1:${REDIS_PORT:-6379}:6379"  # Change this line
    environment:
      - REDIS_PASSWORD=${REDIS_PASSWORD:-changeme}  # Add this line
    healthcheck:
      start_period: 10s  # Add this
    security_opt:  # Add this entire section
      - no-new-privileges:true
    cap_drop:  # Add this entire section
      - ALL
    cap_add:  # Add this entire section
      - SETGID
      - SETUID
      - DAC_OVERRIDE
    deploy:
      resources:
        limits:
          memory: 256M  # Change from 128M
        reservations:
          memory: 128M  # Change from 64M
```

#### 2. In `docker-compose.prod.yml`, update Redis:
```yaml
  redis:
    image: redis:7.2.11-alpine  # Add this line
    environment:  # Add this entire section
      - REDIS_PASSWORD=${REDIS_PASSWORD}
    command: >  # Add this entire section
      redis-server /usr/local/etc/redis/redis.conf
      --requirepass "${REDIS_PASSWORD}"
```

#### 3. Update `redis/redis.conf`:
```bash
# Download the updated config from GitHub
curl -o redis/redis.conf https://raw.githubusercontent.com/abya-university/ABYA-Ecosystem/deployment/redis/redis.conf
```

#### 4. Copy new documentation files:
```bash
# Download new security documentation
curl -o SECURITY_UPDATE_CVE-2025-49844.md https://raw.githubusercontent.com/abya-university/ABYA-Ecosystem/deployment/SECURITY_UPDATE_CVE-2025-49844.md

curl -o QUICK_DEPLOY_SECURITY.md https://raw.githubusercontent.com/abya-university/ABYA-Ecosystem/deployment/QUICK_DEPLOY_SECURITY.md

curl -o scripts/security-update-redis.ps1 https://raw.githubusercontent.com/abya-university/ABYA-Ecosystem/deployment/scripts/security-update-redis.ps1
```

## Environment Variables Checklist

Make sure these are set in your `.env` file or docker-compose.yml:

```bash
# Critical - Security
REDIS_PASSWORD=your_secure_password_here

# Blockchain
VITE_APP_RPC_URL=your_rpc_url
VITE_APP_CHAIN_ID=your_chain_id

# Contract Addresses (your deployed contracts)
VITE_APP_LMS_TOKEN_ADDRESS=0x...
VITE_APP_TREASURY_ADDRESS=0x...
VITE_APP_VESTING_ADDRESS=0x...
# ... all other addresses

# IPFS
VITE_APP_PINATA_API_KEY=your_key
VITE_APP_PINATA_SECRET_KEY=your_secret
```

## Troubleshooting

### Issue: "Your local changes would be overwritten"
**Solution**: Use Option A from Step 3 above - commit your changes first, then pull.

### Issue: Merge conflicts after git pull
```bash
# Check which files have conflicts
git status

# For each conflicting file, you can:
# 1. Accept incoming changes and manually re-add your env vars
git checkout --theirs docker-compose.yml
# Then manually edit to add your environment variables

# 2. Or accept your version and manually add security updates
git checkout --ours docker-compose.yml
# Then manually add the Redis security changes

# After resolving, mark as resolved
git add docker-compose.yml
git commit -m "Merged security updates with local env vars"
```

### Issue: Redis won't start after update
```bash
# Check logs
docker logs abya-redis

# Common fixes:
# 1. Make sure REDIS_PASSWORD is set in .env
# 2. Check redis.conf syntax
# 3. Verify volume permissions

# If needed, remove and recreate
docker-compose down -v
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Final Verification

```bash
# Full system check
echo "=== Container Status ==="
docker ps

echo -e "\n=== Redis Version ==="
docker exec abya-redis redis-cli INFO SERVER | grep redis_version

echo -e "\n=== Redis Auth Test ==="
docker exec abya-redis redis-cli -a "$REDIS_PASSWORD" PING

echo -e "\n=== Application Health ==="
curl -f http://localhost/health || echo "Health check endpoint not available"

echo -e "\n=== Recent Logs ==="
docker logs abya-frontend --tail 20
docker logs abya-redis --tail 20
```

## Success Criteria

✅ Redis version is 7.2.11
✅ Redis requires password authentication
✅ Redis only listens on localhost (127.0.0.1)
✅ All your environment variables are present
✅ Application connects to Redis successfully
✅ No errors in container logs

---

**After successful deployment, reply to DigitalOcean confirming you've patched the vulnerability!**
