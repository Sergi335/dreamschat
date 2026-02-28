const createNextIntlPlugin = require('next-intl/plugin')

const withNextIntl = createNextIntlPlugin()
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true
  },
  images: { unoptimized: true },
  serverExternalPackages: ['@libsql/client']
}

module.exports = withNextIntl(nextConfig)
