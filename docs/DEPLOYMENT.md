# Cloudflare Workers Deployment Guide

This guide covers the deployment to Cloudflare Workers with OpenNext for the Lite Adserver UI.

## ✅ OpenNext SSR Setup Complete

The application has been migrated from static export to Server-Side Rendering (SSR) using OpenNext Cloudflare adapter. This enables:

- **Dynamic Routes**: `/campaigns/edit/[id]` and other dynamic routes work correctly with server-side rendering
- **Proper Auth Guards**: Authentication can happen server-side
- **Better Performance**: Initial page loads are faster with SSR
- **SEO Benefits**: Server-rendered HTML improves search indexing

## 🏗️ Architecture

The following files have been configured for OpenNext Cloudflare Workers deployment:

- `next.config.js` - Standard Next.js configuration for SSR
- `open-next.config.ts` - OpenNext adapter configuration for Cloudflare Workers
- `wrangler.toml` - Cloudflare Workers configuration with Node.js compatibility
- `package.json` - Build scripts using OpenNext
- `.github/workflows/deploy.yml` - GitHub Actions for automatic deployment
- `.gitignore` - Excludes `.open-next/` build output

### Build Output Structure

When you run `npm run build:cf`, OpenNext generates:

```
.open-next/
├── worker.js           # Main worker entry point
├── assets/             # Static assets (CSS, JS, images)
├── server-functions/   # Server-side rendering functions
└── middleware/         # Next.js middleware handlers
```

## 🔧 Environment Variables

Environment variables are centrally managed in `wrangler.toml`:

```toml
# Used for local development (wrangler dev)
[vars]
NEXT_PUBLIC_AD_SERVER_URL = "http://localhost:8787"
NEXT_PUBLIC_TIMEZONE = "UTC"

# Production deployment overrides
[env.production]
vars = { 
  NODE_ENV = "production",
  NEXT_PUBLIC_AD_SERVER_URL = "https://api.affset.com",
  NEXT_PUBLIC_TIMEZONE = "UTC"
}

# Preview deployment overrides  
[env.preview]
vars = { 
  NODE_ENV = "development",
  NEXT_PUBLIC_AD_SERVER_URL = "http://localhost:8787",
  NEXT_PUBLIC_TIMEZONE = "UTC"
}
```

With OpenNext SSR:
- `process.env.NEXT_PUBLIC_*` works natively in both server and client components
- No need for custom environment variable injection
- Environment variables are available at build time and runtime

## 🚀 Deployment Options

### Option 1: Manual Deployment

1. **Install Wrangler CLI** (if not already installed)
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**
   ```bash
   wrangler login
   ```

3. **Build and Deploy**
   ```bash
   npm run build:cf
   wrangler deploy --env production
   ```

### Option 2: GitHub Actions (Recommended)

1. **Set up GitHub Secrets**
   - `CLOUDFLARE_API_TOKEN` - Your Cloudflare API token with Workers:Edit permissions
   - `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID

2. **Push to main branch**
   ```bash
   git add .
   git commit -m "Deploy to Cloudflare Workers"
   git push origin main
   ```

3. **Monitor deployment**
   - Check GitHub Actions tab for deployment status
   - The Worker is deployed as `lite-adserver-ui-production`
   - Check Cloudflare Workers dashboard for live URL

## 🎯 Getting Your Cloudflare Credentials

### API Token
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use "Edit Cloudflare Workers" template, or create a custom token with:
   - Account: Cloudflare Workers Scripts:Edit
   - Account: Account Settings:Read
4. Copy the token and add to GitHub secrets as `CLOUDFLARE_API_TOKEN`

### Account ID
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select your domain/account
3. Copy the Account ID from the right sidebar
4. Add to GitHub secrets as `CLOUDFLARE_ACCOUNT_ID`

## 🔍 Local Development

### Development Server (Next.js)
```bash
npm run dev
```
Standard Next.js development server with hot reload at `http://localhost:3000`

### Local Worker Testing (Wrangler)
```bash
npm run build:cf
npm run dev:worker
```
Test the OpenNext-generated worker locally at `http://localhost:8787`

This simulates the actual Cloudflare Workers environment with:
- Server-side rendering
- Environment variables from `wrangler.toml`
- Static asset serving
- Dynamic route handling

## 📊 Multi-Tenant Architecture

The application supports multi-tenant deployment via subdomains (e.g., `*.affset.com`):

- **Client-Side**: `getNamespace()` in `lib/api.ts` extracts subdomain from `window.location.hostname`
- **Server-Side**: Can use `headers().get('host')` in server components to extract namespace
- **API Calls**: The `x-namespace` header is automatically added to all API requests

The OpenNext SSR setup maintains this multi-tenant architecture while enabling server-side rendering.

## 🐛 Troubleshooting

### Build Errors

**Error: Cannot find package 'wrangler'**
- Run: `npm install --save-dev wrangler --legacy-peer-deps`

**Error: Missing open-next.config.ts**
- The config file should exist at project root
- Contains OpenNext adapter settings for Cloudflare Workers

**Error: Node.js compatibility warnings**
- Ensure `compatibility_flags = ["nodejs_compat"]` in `wrangler.toml`
- Ensure `compatibility_date = "2024-09-23"` or later

### Runtime Errors

**Dynamic routes return 404**
- Verify OpenNext build completed successfully
- Check `.open-next/worker.js` exists
- Ensure `wrangler.toml` points to `.open-next/worker.js`

**Environment variables not available**
- Server components: Use `process.env.NEXT_PUBLIC_*`
- Client components: Environment variables are embedded at build time
- Check `wrangler.toml` has correct vars for your environment

**"use client" errors**
- Components using React hooks (`useState`, `useEffect`, etc.) must have `"use client"` directive
- Server components cannot use browser-only APIs
- Auth checks in client components should use `useAuth()` hook

### Performance Issues

**Slow initial page loads**
- Check Cloudflare Workers dashboard for cold start metrics
- Verify static assets are being cached properly
- Review server-side data fetching patterns

**Build takes too long**
- OpenNext build adds ~10-30 seconds to build time
- This is normal and produces optimized worker bundles
- Consider using incremental builds if available

## 📞 Support

For OpenNext Cloudflare specific issues:
- [OpenNext Cloudflare Documentation](https://opennextjs.com/docs/cloudflare)
- [GitHub Repository](https://github.com/opennextjs/opennextjs-cloudflare)

For Cloudflare Workers specific issues:
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Community Forum](https://community.cloudflare.com/)
- [Discord Support](https://discord.gg/cloudflaredev)

For application-specific issues:
- Check the main README.md for general troubleshooting
- Review the Lite Adserver backend logs
- Verify API key permissions and validity

## 🎯 Benefits of OpenNext SSR

1. **Dynamic Routes Work Properly**: `/campaigns/edit/[id]` renders server-side with correct data
2. **Better SEO**: Search engines can crawl server-rendered HTML
3. **Faster Initial Loads**: Server sends fully rendered HTML
4. **Cleaner Code**: Fewer client-side workarounds needed
5. **Modern Architecture**: Standard Next.js SSR patterns on Cloudflare edge network 