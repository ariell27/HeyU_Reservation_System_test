# Redis (Upstash) Configuration Guide

## Vercel KV vs Upstash Redis

### Vercel KV

- **What is Vercel KV**: Vercel KV is Vercel's wrapper for Upstash Redis, deeply integrated with the Vercel platform
- **Advantages**:
  - One-click creation and management in Vercel Dashboard
  - Automatic environment variable configuration
  - Unified billing and management
  - Seamless integration with Vercel deployments
- **Use case**: Projects deployed on Vercel, want simplified configuration and management

### Upstash Redis

- **What is Upstash Redis**: Independent serverless Redis service
- **Advantages**:
  - More flexible, can be used on any platform (not limited to Vercel)
  - More configuration options
  - Can be managed directly in Upstash Dashboard
- **Use case**: Need cross-platform usage, or need more control

**Note**: Both are based on Upstash Redis underneath, with identical functionality, only the integration method differs.

## Configuration Methods

### Method 1: Use Vercel KV (Recommended if deployed on Vercel)

When you add an Upstash Redis database in Vercel Dashboard Storage, Vercel will automatically set the following environment variables:

- `KV_URL` - Vercel KV connection URL
- `KV_REST_API_URL` - Upstash REST API URL
- `KV_REST_API_TOKEN` - Upstash REST API Token
- `KV_REST_API_READ_ONLY_TOKEN` - Read-only Token (optional)

**No additional configuration needed**, the code will automatically use Vercel KV.

### Method 2: Use Upstash Redis (Direct usage)

If you want to use Upstash Redis directly (e.g., not deploying on Vercel, or need more control), you need to:

1. Create a Redis database in [Upstash Dashboard](https://console.upstash.com/)
2. Get connection information:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. Install dependencies:
   ```bash
   npm install @upstash/redis
   ```
4. Set environment variables (see "Local Development Configuration" below)

## Local Development Configuration

### If using Vercel KV

1. Get environment variable values from Vercel Dashboard:

   - Go to your project
   - Click Settings → Environment Variables
   - Find and copy the values of the following environment variables:
     - `KV_URL`
     - `KV_REST_API_URL`
     - `KV_REST_API_TOKEN`

2. Create a `.env` file in the `backend` directory:

```env
KV_URL=your_kv_url_here
KV_REST_API_URL=your_rest_api_url_here
KV_REST_API_TOKEN=your_rest_api_token_here
PORT=3001
```

### If using Upstash Redis

1. Get connection information from Upstash Dashboard:

   - Go to your Redis database
   - Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

2. Create a `.env` file in the `backend` directory:

```env
UPSTASH_REDIS_REST_URL=your_rest_api_url_here
UPSTASH_REDIS_REST_TOKEN=your_rest_api_token_here
PORT=3001
```

3. Install Upstash Redis client:

```bash
npm install @upstash/redis
```

### Start Server

Install dependencies (if not already installed):

```bash
cd backend
npm install
```

Start the server:

```bash
npm start
# or development mode
npm run dev
```

**Note**: The code automatically detects environment variables, prioritizing Upstash Redis (if `UPSTASH_REDIS_REST_URL` is configured), otherwise using Vercel KV.

## Data Migration

If you previously used JSON files to store data, you can use the migration script to migrate data to Redis:

### Using Migration Script

1. Ensure environment variables are correctly configured (see "Local Development Configuration" above)
2. Run the migration script:

```bash
cd backend
npm run migrate
```

The script will automatically:

- Check Redis connection
- Migrate data from `data/bookings.json` to Redis
- Migrate data from `data/services.json` to Redis
- Migrate data from `data/blockedDates.json` to Redis

### Manual Migration

If you don't want to use the script, you can also:

1. Start using directly, new data will automatically be saved to Redis
2. If there's no data in Redis, the system will return an empty array
3. Old JSON files can be kept as backup, or deleted

## Verify Connection

After starting the server, if you see the following logs, Redis connection is successful:

```
✅ Redis connection initialized (Vercel KV)
# or
✅ Redis connection initialized (Upstash Redis)
✅ Redis connection test successful
💾 Data storage: Redis
```

If you see warning messages, please check if environment variables are correctly configured.
