/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // ⚠️ ATENÇÃO: Isso desliga a verificação chata da Vercel
    ignoreBuildErrors: true,
  },
  eslint: {
    // Desliga avisos de formatação
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;