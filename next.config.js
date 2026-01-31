/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep images unoptimized for Cloudflare Workers (doesn't support Next.js Image Optimization)
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig 