/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  // Ensure the 2025 baseline JSON (read at runtime via fs) ships with the
  // serverless functions that build analytics.
  outputFileTracingIncludes: {
    '/api/data': ['./data/sales-2025.json'],
    '/api/data/route': ['./data/sales-2025.json'],
  },
};

module.exports = nextConfig;
