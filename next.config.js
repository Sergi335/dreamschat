const createNextIntlPlugin = require('next-intl/plugin')

const withNextIntl = createNextIntlPlugin()
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true
  },
  images: { unoptimized: true },
  serverExternalPackages: ['@libsql/client'],
  output: 'standalone',
  experimental: {
    outputFileTracingIncludes: {
      '/*': ['./node_modules/@libsql/linux-x64-gnu/**/*']
    }
  }
}

module.exports = withNextIntl(nextConfig)
