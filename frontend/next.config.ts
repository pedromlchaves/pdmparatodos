/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    BACKEND_URL: process.env.BACKEND_URL || 'http://127.0.0.1:8000',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "PLACEHOLDER_CLIENT_ID",
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "PLACEHOLDER_CLIENT_SECRET",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "PLACEHOLDER_NEXTAUTH_SECRET",
  },
};

module.exports = nextConfig;

