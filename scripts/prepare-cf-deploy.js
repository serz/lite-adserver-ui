#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

async function prepareCloudflareDeploy() {
  console.log('🚀 Preparing files for Cloudflare Pages deployment...');
  
  const outputDir = 'cf-deploy';
  const nextDir = '.next';
  
  // Clean and create output directory
  await fs.remove(outputDir);
  await fs.ensureDir(outputDir);
  
  // Copy HTML files from server/app
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
    const assetPath = path.join(nextDir, 'static', 'cloudflare-pages-build', asset);
    if (await fs.pathExists(assetPath)) {
      await fs.copy(assetPath, path.join(outputDir, '_next', 'static', 'cloudflare-pages-build', asset));
      console.log(`✅ Copied ${asset}`);
    }
  }
  
  console.log(`🎉 Deployment files prepared in ${outputDir}/`);
  console.log('Files ready for: wrangler pages deploy cf-deploy');
}

prepareCloudflareDeploy().catch(console.error); 