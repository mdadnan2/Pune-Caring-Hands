/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@pch/shared'],
  // Keep the dev hot-reloader from sharing manifests with a production build.
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
};

module.exports = nextConfig;
