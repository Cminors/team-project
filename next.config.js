/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'puppeteer', 'puppeteer-extra', 'puppeteer-extra-plugin-stealth']
    }
    return config
  },
}

module.exports = nextConfig
