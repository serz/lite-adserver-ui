# Cloudflare Pages Deployment Guide

This guide covers the migration from Vercel to Cloudflare Pages for the Lite Adserver UI.

## ✅ Migration Complete

The following files have been configured for Cloudflare Pages deployment:

- `next.config.js` - Next.js configuration optimized for Cloudflare
- `wrangler.toml` - Cloudflare Pages configuration with environment variables
- `package.json` - Updated build scripts for Cloudflare deployment
- `.github/workflows/deploy.yml` - GitHub Actions for automatic deployment
- `.gitignore` - Updated to exclude Cloudflare-specific files

## 🔧 Environment Variables

Environment variables are centrally managed in `wrangler.toml`:

```toml
# Used for local development (wrangler pages dev)
[vars]
NEXT_PUBLIC_AD_SERVER_URL = "https://lite-adserver.affset.com"
NEXT_PUBLIC_TIMEZONE = "UTC"

# Production deployment overrides
[env.production]
vars = { 
  NODE_ENV = "production",
  NEXT_PUBLIC_AD_SERVER_URL = "https://lite-adserver.affset.com",
  NEXT_PUBLIC_TIMEZONE = "UTC"
}

# Preview deployment overrides  
[env.preview]
vars = { 
  NODE_ENV = "development",
  NEXT_PUBLIC_AD_SERVER_URL = "https://lite-adserver.affset.com",
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
   wrangler pages publish .next
   ```

### Option 2: GitHub Actions (Recommended)

1. **Set up GitHub Secrets**
   - `CLOUDFLARE_API_TOKEN` - Your Cloudflare API token with Pages:Edit permissions
   - `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID

2. **Push to main branch**
   ```bash
   git add .
   git commit -m "Migrate to Cloudflare Pages"
   git push origin main
   ```

3. **Monitor deployment**
   - Check GitHub Actions tab for deployment status
   - Check Cloudflare Pages dashboard for live URL

## 🎯 Getting Your Cloudflare Credentials

### API Token
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use "Custom token" template
4. Set permissions: Zone:Zone:Read, Zone:Page Rules:Edit, Account:Cloudflare Pages:Edit
5. Copy the token and add to GitHub secrets

### Account ID
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select your domain/account
3. Copy the Account ID from the right sidebar
4. Add to GitHub secrets

## 🔍 Verifying the Deployment

1. **Build Success**: Check that `npm run build:cf` completes without errors
2. **Environment Variables**: Verify that the app connects to `https://lite-adserver.affset.com`
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

## 🔄 Rollback Plan

If needed, you can quickly rollback to Vercel:

1. Remove Cloudflare-specific files:
   ```bash
   rm wrangler.toml
   rm .github/workflows/deploy.yml
   ```

2. Restore Vercel configuration:
   ```bash
   # Remove output settings from next.config.js
   # Restore .vercel directory if needed
   ```

3. Redeploy to Vercel platform

## 📞 Support

For Cloudflare Pages specific issues:
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Community Forum](https://community.cloudflare.com/)
- [Discord Support](https://discord.gg/cloudflaredev)

For application-specific issues:
- Check the main README.md for general troubleshooting
- Review the Lite Adserver backend logs
- Verify API key permissions and validity 