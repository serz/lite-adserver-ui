/** @type {import('next').NextConfig} */
const nextConfig = {

  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Optimize for Cloudflare Pages
  generateBuildId: async () => {
    return 'cloudflare-pages-build'
  },
  // Disable webpack cache for Cloudflare Pages deployment
  webpack: (config, { dev }) => {
    if (!dev) {
      // Disable cache in production builds for Cloudflare Pages
      config.cache = false;
    }
    return config;
  }
}

module.exports = nextConfig 