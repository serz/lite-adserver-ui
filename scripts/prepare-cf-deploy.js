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
  
  // Copy static assets
  const staticDir = path.join(nextDir, 'static');
  if (await fs.pathExists(staticDir)) {
    await fs.copy(staticDir, path.join(outputDir, '_next', 'static'));
    console.log('✅ Copied static assets');
  }
  
  // Find the actual chunk filenames (they have hashes)
  const chunksDir = path.join(outputDir, '_next', 'static', 'chunks');
  const chunkFiles = await fs.readdir(chunksDir);
  
  const webpackChunk = chunkFiles.find(f => f.startsWith('webpack-'));
  const mainAppChunk = chunkFiles.find(f => f.startsWith('main-app-'));
  const polyfillsChunk = chunkFiles.find(f => f.startsWith('polyfills-'));
  
  // Find CSS file
  const cssDir = path.join(outputDir, '_next', 'static', 'css');
  let cssFile = null;
  if (await fs.pathExists(cssDir)) {
    const cssFiles = await fs.readdir(cssDir);
    cssFile = cssFiles.find(f => f.endsWith('.css'));
  }
  
  // Create an app shell HTML that loads the Next.js app with client-side routing
  const cssLink = cssFile ? `<link rel="stylesheet" href="/_next/static/css/${cssFile}"/>` : '';
  
  const appShellHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charSet="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <title>Lite Adserver</title>
    ${cssLink}
    ${polyfillsChunk ? `<script src="/_next/static/chunks/${polyfillsChunk}" noModule=""></script>` : ''}
</head>
<body>
    <div id="__next"></div>
    ${webpackChunk ? `<script src="/_next/static/chunks/${webpackChunk}" async=""></script>` : ''}
    ${mainAppChunk ? `<script src="/_next/static/chunks/${mainAppChunk}" async=""></script>` : ''}
</body>
</html>`;
  
  const indexPath = path.join(outputDir, 'index.html');
  await fs.writeFile(indexPath, appShellHtml);
  console.log('✅ Created app shell HTML');
  console.log(`   - Webpack: ${webpackChunk || 'not found'}`);
  console.log(`   - Main App: ${mainAppChunk || 'not found'}`);
  console.log(`   - Polyfills: ${polyfillsChunk || 'not found'}`);
  console.log(`   - CSS: ${cssFile || 'not found'}`);
  
  console.log(`🎉 Deployment files prepared in ${outputDir}/`);
  console.log('Files ready for: wrangler deploy');
}

prepareCloudflareDeploy().catch(console.error); 