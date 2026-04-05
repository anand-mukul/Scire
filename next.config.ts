import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: "standalone",
  compress: true,
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', '@react-three/fiber', '@react-three/drei'],
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    qualities: [75, 85],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(self), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; img-src 'self' https: data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com; style-src 'self' 'unsafe-inline'; connect-src 'self' https: ws: data:; object-src 'none'; frame-src 'self' https://api.razorpay.com; frame-ancestors 'self';",
          },
        ],
      },
    ];
  },

  async rewrites() {
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    const parsedUrl = new URL(backendUrl);

    return [
      {
        source: "/api/:path*",
        destination: `${parsedUrl.origin}${parsedUrl.pathname}/:path*`,
      },
    ];
  },
};

export default nextConfig;
