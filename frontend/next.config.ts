import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    skipWaiting: true,
    exclude: [
      /app\/.*\/audit\//,
      /app\/.*\/sla\//,
      /app\/.*\/sop\//,
      /app\/.*\/kb\//,
      /app\/.*\/predictions\//,
      /app\/.*\/workforce\//,
      /app\/.*\/users\//,
      /app\/.*\/reports\//,
      /app\/.*\/notifications\//,
      /app\/.*\/scan\//,
    ],
    runtimeCaching: [
      {
        urlPattern: /\/_next\/static\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "static-resources",
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 30 * 24 * 60 * 60,
          },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  /* config options here */
};

export default withPWA(nextConfig);
