import type { NextConfig } from 'next'
import { createMDX } from 'fumadocs-mdx/next'

const withMDX = createMDX({})

const config: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    reactCompiler: true,
  },
}

export default withMDX(config)
