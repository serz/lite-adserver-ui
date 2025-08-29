# Migration from Cloudflare Pages to Workers

This document outlines the migration of the Lite Adserver UI from Cloudflare Pages to Cloudflare Workers with Static Assets.

## What Changed

### 1. Wrangler Configuration (`wrangler.toml`)

**Before (Pages):**
```toml
name = "lite-adserver-ui"
compatibility_date = "2024-01-01"
pages_build_output_dir = "cf-deploy"
```

**After (Workers with Static Assets):**
```toml
name = "lite-adserver-ui"
compatibility_date = "2024-01-01"
main = "worker.js"

# Static assets configuration
[assets]
directory = "cf-deploy"
binding = "ASSETS"
```

### 2. Worker Entry Point (`worker.js`)

Created a new Worker script that:
- Serves static assets from the `ASSETS` binding
- Handles SPA routing by serving `index.html` for non-asset requests
- Provides proper fallback for 404s

### 3. Package.json Scripts

**Added new scripts:**
- `dev:worker` - Run Worker development server
- `deploy` - Deploy to Workers (replaces Pages deployment)

### 4. Next.js Configuration

**Updated `next.config.js`:**
- Changed build ID from `cloudflare-pages-build` to `cloudflare-workers-build`
- Removed `output: 'export'` to support dynamic routes
- Maintained compatibility with Cloudflare deployment

### 5. Build Script (`scripts/prepare-cf-deploy.js`)

**Updated to handle Workers deployment:**
- Copies HTML files from Next.js server output
- Handles static assets properly
- Creates fallback `index.html` for SPA routing

## Benefits of Migration

1. **Better Performance**: Workers typically have lower cold start times than Pages Functions
2. **More Control**: Direct control over request handling and routing
3. **Enhanced Features**: Access to full Workers runtime APIs
4. **Simplified Architecture**: Single Worker handles both static assets and dynamic routing

## Development Workflow

### Local Development

**Option 1: Next.js Dev Server (Recommended for development)**
```bash
npm run dev
```

**Option 2: Worker Dev Server (Testing production behavior)**
```bash
npm run build:cf
npm run dev:worker
```

### Deployment

**Build and Deploy:**
```bash
npm run build:cf
npm run deploy
```

**Or use the old Pages deployment (still supported):**
```bash
npm run build:cf
npm run deploy:cf
```

## Compatibility

The migration maintains backward compatibility with:
- All existing environment variables
- Current build process
- Development workflow
- API integrations

## Migration Steps Performed

1. ✅ Updated `wrangler.toml` configuration for Workers with Static Assets
2. ✅ Created Worker entry point script (`worker.js`)
3. ✅ Updated package.json scripts for Workers deployment
4. ✅ Updated Next.js configuration for Workers compatibility
5. ✅ Updated build script for Workers static assets
6. ✅ Tested the migration and deployment

## Issues Encountered and Solutions

### Issue 1: Environment Variables Not Applied
**Problem**: When deploying with `wrangler deploy`, it used default environment variables (localhost) instead of production variables.

**Solution**: Always deploy with `--env production` flag. Updated the default deploy script:
```bash
npm run deploy  # Now automatically uses --env production
```

### Issue 2: API Client Using Wrong URL
**Problem**: The API client was using `https://api.liteadserver.example.com` instead of the configured production URL.

**Solution**: Updated the API client fallback URL to use the production URL directly:
```typescript
// Fallback to the production URL
return 'https://lite-adserver.affset.com';
```

## Verification

The migration was tested and verified:
- ✅ Build process completes successfully
- ✅ Worker development server runs without errors
- ✅ Static assets are served correctly
- ✅ SPA routing works as expected
- ✅ Production environment variables are deployed correctly
- ✅ API client uses the correct production URL

## Rollback Plan

If needed, you can rollback by:
1. Reverting `wrangler.toml` to use `pages_build_output_dir`
2. Removing `worker.js`
3. Using `npm run deploy:cf` for Pages deployment

The build artifacts remain compatible with both Workers and Pages deployment methods.
