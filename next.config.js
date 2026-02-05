/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep images unoptimized for Cloudflare Workers (doesn't support Next.js Image Optimization)
  images: {
    unoptimized: true
  },
  // Strip console.* in production to avoid logging in browser
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

module.exports = nextConfig 