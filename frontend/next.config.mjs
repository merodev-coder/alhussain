/** @type {import('next').NextConfig} */
const nextConfig = {
  // Type errors now fail the build instead of being silently shipped.
  typescript: {
    ignoreBuildErrors: false,
  },
  compress: true,
  poweredByHeader: false,
  images: {
    // Uploaded photos are compressed in the browser at upload time, so the
    // storefront serves them as-is (no Vercel image-optimization quota used).
    unoptimized: true,
  },
  experimental: {
    // Import only the icons / animation helpers that are actually used
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
}

export default nextConfig
