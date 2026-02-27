/** @type {import('next').NextConfig} */
const nextConfig = {
  // This project is API-only — no pages to render
  // Vercel will still handle all /api/* routes correctly
  reactStrictMode: true,

  // Increase payload size limit for API routes (default is 1mb)
  // Our submit payload with a full cart is well under this
  experimental: {
    serverComponentsExternalPackages: ['nodemailer', 'bcryptjs'],
  },

  // Silence the "missing pages/_app" warning — we're API only
  pageExtensions: ['ts', 'tsx'],

  // Vercel automatically sets NODE_ENV=production on deploy
  // No need to configure anything extra here
};

module.exports = nextConfig;
