# Cloudflare Workers Deployment Guide

This guide covers the deployment to Cloudflare Workers with Static Assets for the Lite Adserver UI.

## ✅ Migration Complete

The following files have been configured for Cloudflare Pages deployment:

- `next.config.js` - Next.js configuration optimized for Cloudflare
- `wrangler.toml` - Cloudflare Pages configuration with environment variables
- `package.json` - Updated build scripts for Cloudflare deployment
- `.github/workflows/deploy.yml` - GitHub Actions for automatic deployment
- `.gitignore` - Updated to exclude Cloudflare-specific files
- `.cfignore` - Excludes cache files to prevent 25 MiB file size limit issues
- `scripts/prepare-cf-deploy.js` - Prepares build output with correct file structure for Cloudflare Pages

## 🔧 Environment Variables

Environment variables are centrally managed in `wrangler.toml`:

```toml
# Used for local development (wrangler pages dev)
[vars]
NEXT_PUBLIC_AD_SERVER_URL = "https://api.affset.com"
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
  NEXT_PUBLIC_AD_SERVER_URL = "https://api.affset.com",
  NEXT_PUBLIC_TIMEZONE = "UTC"
}
```

## 🚀 Deployment Options

### Option 1: Manual Deployment

1. **Install Wrangler CLI**
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
   v
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
4. Add to GitHub secrets

## 🔍 Verifying the Deployment

1. **Build Success**: Check that `npm run build:cf` completes without errors
2. **Environment Variables**: Verify that the app connects to `https://api.affset.com`
3. **Routing**: Test all pages including dynamic routes like `/dashboard/campaigns/edit/[id]`
4. **Authentication**: Verify API key authentication works correctly
5. **Local Development**: Test with `wrangler pages dev .next` (after building)

## 📊 Performance Benefits

- **Global CDN**: Faster delivery via Cloudflare's edge network
- **Zero Cold Starts**: No server-side rendering delays
- **Built-in Security**: DDoS protection and Web Application Firewall
- **Analytics**: Detailed performance metrics in Cloudflare dashboard

## 🐛 Troubleshooting

### Build Errors
- Ensure Next.js version is compatible (14.2.28+)
- Check that all dependencies are properly installed
- Verify environment variables are set correctly

### Runtime Errors
- Check Cloudflare Pages Functions logs
- Verify API endpoints are accessible
- Ensure environment variables are properly configured

### Domain Issues
- Configure custom domain in Cloudflare Pages dashboard
- Update DNS records to point to Cloudflare Pages
- Enable HTTPS redirect in Cloudflare dashboard

## 📞 Support

For Cloudflare Pages specific issues:
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Community Forum](https://community.cloudflare.com/)
- [Discord Support](https://discord.gg/cloudflaredev)

For application-specific issues:
- Check the main README.md for general troubleshooting
- Review the Lite Adserver backend logs
- Verify API key permissions and validity 