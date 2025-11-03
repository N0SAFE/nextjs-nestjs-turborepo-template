import { Config } from 'tailwindcss'
import sharedConfig from '@repo-configs/tailwind'

const config: Config = {
    content: [
        './src/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './providers/**/*.{js,ts,jsx,tsx,mdx}',
        '../../packages/ui/base/src/components/**/*.{ts,tsx}',
        '../../packages/ui/base/src/lib/**/*.{ts,tsx}',
        '../../packages/ui/base/src/index.tsx',
    ],
    darkMode: 'class',
    presets: [sharedConfig],
}
export default config
