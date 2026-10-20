import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  typedRoutes: true,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  // 인블로그(logiloop.inblog.io)를 /blog 하위 경로로 서빙. 리다이렉트가 아닌 rewrite여야 한다.
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/blog', destination: 'https://proxy.inblog.dev/logiloop' },
        { source: '/blog/:path*', destination: 'https://proxy.inblog.dev/logiloop/:path*' },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
