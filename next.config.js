/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Optimize for Cloudflare Pages
  generateBuildId: async () => {
    return 'cloudflare-pages-build'
  }
}

module.exports = nextConfig 