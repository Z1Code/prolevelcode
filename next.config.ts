import type { NextConfig } from "next";

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.youtube-nocookie.com https://sdk.mercadopago.com https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self' https:",
  "frame-src 'self' https://www.youtube-nocookie.com https://www.mercadopago.cl https://www.mercadopago.com https://www.mercadopago.com.ar https://www.mercadopago.com.mx https://www.mercadopago.com.br",
  "connect-src 'self' https: wss:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://www.mercadopago.cl https://www.mercadopago.com https://www.mercadopago.com.ar https://www.mercadopago.com.mx https://www.mercadopago.com.br",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");
const appOrigin = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").trim();

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: csp,
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: appOrigin,
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,POST,OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization, X-Signature, X-Request-Id",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

