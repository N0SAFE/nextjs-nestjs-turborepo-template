import MillionLint from '@million/lint'
import withBundleAnalyzer from '@next/bundle-analyzer'
import { NextConfig } from 'next'
import { envSchema } from './env'

// Check if we're running in a lint context or other non-build contexts
const commandLine = process.argv.join(' ')
const isLintContext =
    process.argv.includes('lint') ||
    process.argv.some((arg) => arg.includes('eslint')) ||
    process.env.npm_lifecycle_event === 'lint' ||
    process.env.npm_lifecycle_script?.includes('lint') ||
    process.argv.some((arg) => arg.includes('next-lint')) ||
    commandLine.endsWith('lint')

if (!process.env.API_URL) {
    if (isLintContext) {
        // Provide a default URL for linting context to avoid breaking the lint process
        process.env.API_URL = 'http://localhost:3001'
        console.warn(
            'API_URL not defined, using default for lint context:',
            process.env.API_URL
        )
    } else {
        throw new Error('API_URL is not defined')
    }
}

// Handle both full URLs and hostname-only values (for Render deployment)
const apiUrl = new URL(envSchema.shape.API_URL.parse(process.env.API_URL))

const noCheck = process.env.CHECK_ON_BUILD !== 'true'

const nextConfig: NextConfig = {
    async rewrites() {
        console.log(
            'redirect external orpc request from',
            '/api/nest/:path*',
            'to',
            `${apiUrl.href}`
        )
        return [
            {
                source: '/api/auth/:path*',
                destination: `${apiUrl.href}/api/auth/:path*`,
            },
            {
                source: '/api/nest/:path*',
                destination: `${apiUrl.href}/:path*`,
            },
        ]
    },
    eslint: {
        ignoreDuringBuilds: noCheck,
    },
    typescript: {
        ignoreBuildErrors: noCheck,
        // compilerOptions: {
        //   experimentalDecorators: true,
        //   useDefineForClassFields: true,
        // },
    },
    reactStrictMode: true,
    transpilePackages: ['@repo/ui', '@repo/nextjs-devtool'],
    experimental: {
        // ppr: 'incremental',
        reactCompiler: true,
    },
    images: {
        dangerouslyAllowSVG: true,
        remotePatterns: [
            {
                hostname: apiUrl.hostname,
                port: apiUrl.port,
                protocol: apiUrl.protocol.replace(':', '') as 'http' | 'https',
            },
        ],
    },
    output: 'standalone',
}

// Enable MDX and Fumadocs source generation
let exp: NextConfig = nextConfig

if (process.env.ANALYZE === 'true') {
    exp = withBundleAnalyzer()(exp)
}

if (
    process.env.NODE_ENV === 'development' &&
    process.env.MILLION_LINT === 'true'
) {
    const millionLintConfig = {
        rsc: true,
        dev: 'debug' as const,
    }
    exp = MillionLint.next(millionLintConfig)(exp)
}

module.exports = (
    phase: string,
    {
        defaultConfig,
    }: {
        defaultConfig: NextConfig
    }
) => {
    return {
        ...defaultConfig,
        ...exp,
        env: {
            PHASE: phase,
            ...defaultConfig.env,
            ...exp.env,
        },
    }
}
