/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  // Use server mode instead of standalone for proper env var access
  // Standalone inlines env vars at build time, server mode reads at runtime
  output: 'server',
  // Use relative paths for static assets to work with HA Ingress
  assetPrefix: './',
  // NOTE: Do NOT add env vars here - they get inlined at build time
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };
    return config;
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
