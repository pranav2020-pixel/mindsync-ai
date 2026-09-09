/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { domains: ['localhost'] },
  async rewrites() {
    let apiUrl = process.env.INTERNAL_API_URL || process.env.BACKEND_URL || 'http://backend:4000/api/v1';
    apiUrl = apiUrl.replace(/\/+$/, '');
    if (!apiUrl.endsWith('/api/v1')) {
      apiUrl = `${apiUrl}/api/v1`;
    }
    return [{ source: '/api/v1/:path*', destination: `${apiUrl}/:path*` }];
  },
};
module.exports = nextConfig;
