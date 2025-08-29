/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Optimize for Cloudflare Workers with Static Assets
  generateBuildId: async () => {
    return 'cloudflare-workers-build'
  },
  // Disable webpack cache for Cloudflare deployment
  webpack: (config, { dev }) => {
    if (!dev) {
      // Disable cache in production builds for Cloudflare deployment
      config.cache = false;
    }
    return config;
  },
  distDir: '.next'
}

module.exports = nextConfig 