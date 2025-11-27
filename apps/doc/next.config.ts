import type { NextConfig } from 'next'
import { createMDX } from 'fumadocs-mdx/next'

const withMDX = createMDX({})

const config: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  reactCompiler: true, // disable react compiler because of errors with docker and new bun 1.3.0
}

export default withMDX(config)
