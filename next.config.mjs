/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // External packages that should be transpiled for Node.js
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  
  // Experimental features
  experimental: {
    // Force SWC for font handling even with Babel config
    forceSwcTransforms: true
  },
  
  // Skip middleware url normalization
  skipMiddlewareUrlNormalize: true,
  
  // Ensure backend API routes are handled properly
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
  
  // Fix webpack polyfills for Node.js modules
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      'perf_hooks': false,
    };
    return config;
  },
};

export default nextConfig; 