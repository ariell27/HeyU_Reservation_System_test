# Vercel Deployment Guide

## Configuration Files Created

1. **`vercel.json`** - Vercel configuration file that routes all requests to the Express app
2. **`api/index.js`** - Vercel serverless function entry point

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your Git repository
4. **Important**: Set the root directory to `backend` (not the project root)
5. Framework Preset: Other
6. Build Command: (leave empty or `npm install`)
7. Output Directory: (leave empty)
8. Install Command: `npm install`
9. Click "Deploy"

### Option 2: Deploy via Vercel CLI

```bash
cd backend
npm install -g vercel
vercel
```

Follow the prompts and make sure to:

- Set root directory to current directory (backend)
- Confirm the configuration

## Environment Variables

Make sure to set the following environment variables in Vercel Dashboard:

1. Go to your project → Settings → Environment Variables
2. Add the Redis/KV environment variables:
   - `KV_URL` (if using Vercel KV)
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - OR `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (if using Upstash directly)

## API Endpoints

After deployment, your API will be available at:

- `https://your-project.vercel.app/` - Root endpoint (shows API info)
- `https://your-project.vercel.app/health` - Health check
- `https://your-project.vercel.app/api/bookings` - Bookings API
- `https://your-project.vercel.app/api/services` - Services API
- `https://your-project.vercel.app/api/blocked-dates` - Blocked dates API

## Troubleshooting

### "Resource not found" Error

If you're getting `{"success":false,"message":"Resource not found"}`, check:

1. **Root Directory**: Make sure Vercel project root is set to `backend` folder
2. **Build Settings**:
   - Build Command: (can be empty or `npm install`)
   - Output Directory: (leave empty)
   - Install Command: `npm install`
3. **File Structure**: Ensure `api/index.js` and `vercel.json` exist in the `backend` directory
4. **Routes**: Make sure you're accessing the correct API path (e.g., `/api/bookings` not `/bookings`)

### Check Deployment Logs

1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on the latest deployment
3. Check the "Logs" tab for any errors

### Local Testing

To test locally with Vercel:

```bash
cd backend
npm install -g vercel
vercel dev
```

This will run your app locally using Vercel's development server.

## Project Structure

```
backend/
├── api/
│   └── index.js          # Vercel serverless function entry
├── routes/
│   ├── bookings.js
│   ├── services.js
│   └── blockedDates.js
├── utils/
│   ├── redis.js
│   ├── bookingUtils.js
│   ├── serviceUtils.js
│   └── blockedDatesUtils.js
├── server.js             # Express app
├── vercel.json           # Vercel configuration
└── package.json
```

## Notes

- The app automatically detects if it's running on Vercel and won't start a local server
- Redis connection is initialized on first request
- All routes are prefixed with `/api/` except `/` and `/health`
