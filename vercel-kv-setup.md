# Vercel KV Setup Instructions

## 1. Set up Vercel KV in your Vercel Dashboard

1. Go to your Vercel project dashboard
2. Navigate to the "Storage" tab
3. Click "Browse Storage" or "Create New"
4. Select "Upstash" from the Marketplace Database Providers
5. Choose "Serverless DB (Redis, Vector, Queue, Search)"
6. Choose a name for your database (e.g., "workflow-builder-kv")
7. Select a region close to your users
8. Click "Create"

## 2. Environment Variables

Vercel will automatically add these environment variables to your project:

- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

## 3. Local Development

For local development, you'll need to create a `.env.local` file with these variables:

```bash
KV_REST_API_URL=https://your-kv-instance.upstash.io
KV_REST_API_TOKEN=your-token-here
KV_REST_API_READ_ONLY_TOKEN=your-read-only-token-here
```

You can find these values in your Vercel dashboard under the KV database settings.

## 4. Deploy

Once the KV database is set up and environment variables are configured, you can deploy to Vercel and the app will work with persistent storage!

## 5. Migration from File System

The existing data in `data/workflows.json` will need to be manually migrated to KV after deployment, or you can start fresh with the new KV storage.
