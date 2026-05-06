/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Isso ajuda a silenciar aquele aviso de "workspace root"
  experimental: {
    turbo: {
      root: '..', 
    },
  },
}

export default nextConfig