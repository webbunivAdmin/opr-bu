/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "scrupulous-buzzard-261.convex.cloud",
      },
      {
        hostname: "warmhearted-bird-895.convex.cloud",
      },
    ],
  },
  typescript: {
    // Allow builds to complete even if there are TypeScript errors
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
