#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

async function prepareCloudflareDeploy() {
  console.log('🚀 Preparing files for Cloudflare Workers with Static Assets deployment...');
  
  const outputDir = 'cf-deploy';
  const nextDir = '.next';
  
  // Clean and create output directory
  await fs.remove(outputDir);
  await fs.ensureDir(outputDir);
  
  // Copy HTML files from server/app (SSG output)
  const serverAppDir = path.join(nextDir, 'server', 'app');
  if (await fs.pathExists(serverAppDir)) {
    await fs.copy(serverAppDir, outputDir, {
      filter: (src, dest) => {
        // Only copy HTML and meta files
        return src.endsWith('.html') || src.endsWith('.meta') || fs.statSync(src).isDirectory();
      }
    });
    console.log('✅ Copied HTML files from server/app');
  }
  
  // Copy static assets
  const staticDir = path.join(nextDir, 'static');
  if (await fs.pathExists(staticDir)) {
    await fs.copy(staticDir, path.join(outputDir, '_next', 'static'));
    console.log('✅ Copied static assets');
  }
  
  // Copy chunks and other assets from build root
  const buildAssets = ['chunks', 'css', 'media'];
  for (const asset of buildAssets) {
    const assetPath = path.join(nextDir, 'static', 'cloudflare-workers-build', asset);
    if (await fs.pathExists(assetPath)) {
      await fs.copy(assetPath, path.join(outputDir, '_next', 'static', 'cloudflare-workers-build', asset));
      console.log(`✅ Copied ${asset}`);
    }
  }
  
  // Ensure index.html exists at root for SPA routing
  const indexPath = path.join(outputDir, 'index.html');
  if (!(await fs.pathExists(indexPath))) {
    // Try to copy from the dashboard route or create a basic one
    const dashboardIndexPath = path.join(outputDir, 'dashboard', 'index.html');
    if (await fs.pathExists(dashboardIndexPath)) {
      await fs.copy(dashboardIndexPath, indexPath);
      console.log('✅ Copied dashboard index.html as root index.html');
    } else {
      // Create a basic index.html that redirects to dashboard
      const basicIndexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lite Adserver UI</title>
    <script>
        // Redirect to dashboard
        window.location.href = '/dashboard';
    </script>
</head>
<body>
    <div id="__next"></div>
</body>
</html>`;
      await fs.writeFile(indexPath, basicIndexHtml);
      console.log('✅ Created fallback index.html');
    }
  }
  
  console.log(`🎉 Deployment files prepared in ${outputDir}/`);
  console.log('Files ready for: wrangler deploy');
}

prepareCloudflareDeploy().catch(console.error); 